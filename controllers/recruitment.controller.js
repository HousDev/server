// controllers/recruitment.controller.js
const RecruitmentModel = require('../models/recruitment.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/recruitment/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

class RecruitmentController {
  // Upload middleware
  static uploadFile = upload.single('resume');

  // JOBS
  static async createJob(req, res) {
    try {
      const {
        job_title,
        department_id,
        department_name,
        openings,
        employment_type,
        experience_required,
        salary_min,
        salary_max,
        location,
        description,
        requirements,
        responsibilities
      } = req.body;

      if (!job_title || !location || !description) {
        return res.status(400).json({
          success: false,
          message: 'Job title, location, and description are required'
        });
      }

      const jobData = {
        job_title,
        department_id: department_id || null,
        department_name: department_name || '',
        openings: openings || 1,
        employment_type: employment_type || 'full_time',
        experience_required: experience_required || '',
        salary_min: salary_min ? parseFloat(salary_min) : null,
        salary_max: salary_max ? parseFloat(salary_max) : null,
        location,
        description,
        requirements: requirements || '',
        responsibilities: responsibilities || '',
        status: 'open',
        created_by: req.user.id,
        created_by_name: req.user.name
      };

      const job = await RecruitmentModel.createJob(jobData);

      return res.status(201).json({
        success: true,
        message: 'Job posted successfully',
        data: job
      });

    } catch (error) {
      console.error('Create job error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to post job'
      });
    }
  }

  static async getJobs(req, res) {
    try {
      const filters = req.query;
      const jobs = await RecruitmentModel.getAllJobs(filters);

      return res.status(200).json({
        success: true,
        data: jobs
      });

    } catch (error) {
      console.error('Get jobs error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch jobs'
      });
    }
  }

  static async getJobById(req, res) {
    try {
      const { id } = req.params;
      const job = await RecruitmentModel.getJobById(id);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: job
      });

    } catch (error) {
      console.error('Get job error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch job'
      });
    }
  }

  static async updateJobStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['open', 'closed', 'on_hold'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }

      const success = await RecruitmentModel.updateJobStatus(id, status);

      if (success) {
        return res.status(200).json({
          success: true,
          message: 'Job status updated successfully'
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

    } catch (error) {
      console.error('Update job status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update job status'
      });
    }
  }

  // APPLICATIONS
  static async getJobApplications(req, res) {
    try {
      const { jobId } = req.params;
      const filters = req.query;

      const applications = await RecruitmentModel.getApplicationsByJob(jobId, filters);

      return res.status(200).json({
        success: true,
        data: applications
      });

    } catch (error) {
      console.error('Get applications error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch applications'
      });
    }
  }

  static async createApplication(req, res) {
    try {
      const {
        job_id,
        applicant_name,
        applicant_email,
        applicant_phone,
        experience_years,
        current_company,
        current_ctc,
        expected_ctc,
        notice_period,
        cover_letter,
        referred_by,
        referred_by_name,
        share_link_hash
      } = req.body;

      if (!job_id || !applicant_name || !applicant_email) {
        return res.status(400).json({
          success: false,
          message: 'Job ID, applicant name, and email are required'
        });
      }

      const applicationData = {
        job_id,
        job_title: req.body.job_title || '',
        applicant_name,
        applicant_email,
        applicant_phone: applicant_phone || '',
        experience_years: experience_years || 0,
        current_company: current_company || '',
        current_ctc: current_ctc ? parseFloat(current_ctc) : null,
        expected_ctc: expected_ctc ? parseFloat(expected_ctc) : null,
        notice_period: notice_period || 0,
        cover_letter: cover_letter || '',
        interview_stage: 'applied',
        offer_status: 'no_offer',
        source: referred_by ? 'referral' : (share_link_hash ? 'career_site' : 'other'),
        referred_by: referred_by || null,
        referred_by_name: referred_by_name || '',
        applied_via_share_link: !!share_link_hash,
        share_link_hash: share_link_hash || null,
        status: 'active',
        applied_date: new Date().toISOString().split('T')[0]
      };

      // Add resume if uploaded
      if (req.file) {
        applicationData.resume_path = req.file.path.replace(/\\/g, '/');
      }

      const application = await RecruitmentModel.createApplication(applicationData);

      // Update job stats
      await RecruitmentModel.updateJobStats(job_id, 'total_applications');
      if (share_link_hash) {
        await RecruitmentModel.updateJobStats(job_id, 'share_link_applications');
      }

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: application
      });

    } catch (error) {
      console.error('Create application error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit application'
      });
    }
  }

  static async updateApplicationStage(req, res) {
    try {
      const { id } = req.params;
      const { interview_stage } = req.body;

      const validStages = [
        'applied', 'screening', 'shortlisted', 'interview_scheduled',
        'interviewed', 'selected', 'rejected'
      ];

      if (!validStages.includes(interview_stage)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid interview stage'
        });
      }

      // Get current application to get job_id
      const application = await RecruitmentModel.getApplicationById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      const success = await RecruitmentModel.updateApplicationStage(id, interview_stage);

      if (success) {
        // Update job stats based on stage
        let statField = null;
        if (interview_stage === 'shortlisted') {
          statField = 'shortlisted';
        } else if (interview_stage === 'interview_scheduled') {
          statField = 'interviews';
        } else if (interview_stage === 'selected') {
          statField = 'selected';
        }

        if (statField) {
          await RecruitmentModel.updateJobStats(application.job_id, statField);
        }

        return res.status(200).json({
          success: true,
          message: 'Application stage updated successfully'
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

    } catch (error) {
      console.error('Update application stage error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update application stage'
      });
    }
  }

  static async sendOffer(req, res) {
    try {
      const { id } = req.params;
      const { offered_ctc, joining_date } = req.body;

      if (!offered_ctc) {
        return res.status(400).json({
          success: false,
          message: 'Offered CTC is required'
        });
      }

      const offerData = {
        offer_status: 'offer_sent',
        offered_ctc: parseFloat(offered_ctc),
        offer_date: new Date().toISOString().split('T')[0],
        joining_date: joining_date || null
      };

      const application = await RecruitmentModel.getApplicationById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      const success = await RecruitmentModel.updateApplicationOffer(id, offerData);

      if (success) {
        // Update job stats
        await RecruitmentModel.updateJobStats(application.job_id, 'offers_sent');

        return res.status(200).json({
          success: true,
          message: 'Offer sent successfully'
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

    } catch (error) {
      console.error('Send offer error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send offer'
      });
    }
  }

  // REFERRALS
  static async createReferral(req, res) {
    try {
      const {
        job_id,
        job_title,
        candidate_name,
        candidate_email,
        candidate_phone,
        notes
      } = req.body;

      if (!job_id || !candidate_name || !candidate_email) {
        return res.status(400).json({
          success: false,
          message: 'Job ID, candidate name, and email are required'
        });
      }

      const referralData = {
        job_id,
        job_title: job_title || '',
        referrer_id: req.user.id,
        referrer_name: req.user.name,
        referrer_email: req.user.email,
        candidate_name,
        candidate_email,
        candidate_phone: candidate_phone || '',
        notes: notes || '',
        status: 'pending'
      };

      // Add resume if uploaded
      if (req.file) {
        referralData.resume_path = req.file.path.replace(/\\/g, '/');
      }

      const referral = await RecruitmentModel.createReferral(referralData);

      return res.status(201).json({
        success: true,
        message: 'Referral submitted successfully',
        data: referral
      });

    } catch (error) {
      console.error('Create referral error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit referral'
      });
    }
  }

  static async getJobReferrals(req, res) {
    try {
      const { jobId } = req.params;
      const referrals = await RecruitmentModel.getReferralsByJob(jobId);

      return res.status(200).json({
        success: true,
        data: referrals
      });

    } catch (error) {
      console.error('Get referrals error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch referrals'
      });
    }
  }

  // SHARE LINKS
  static async generateShareLink(req, res) {
    try {
      const { jobId } = req.params;

      const job = await RecruitmentModel.getJobById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      const hash = await RecruitmentModel.generateShareLink(
        jobId, 
        req.user.id, 
        req.user.name
      );

      if (hash) {
        return res.status(200).json({
          success: true,
          message: 'Share link generated successfully',
          data: {
            hash,
            link: `${req.protocol}://${req.get('host')}/jobs/apply/${hash}`,
            job_title: job.job_title
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate share link'
        });
      }

    } catch (error) {
      console.error('Generate share link error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate share link'
      });
    }
  }

  static async getJobByShareLink(req, res) {
    try {
      const { hash } = req.params;

      const job = await RecruitmentModel.getJobByShareLink(hash);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired share link'
        });
      }

      return res.status(200).json({
        success: true,
        data: job
      });

    } catch (error) {
      console.error('Get job by share link error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch job details'
      });
    }
  }

  // STATISTICS
  static async getStats(req, res) {
    try {
      const stats = await RecruitmentModel.getRecruitmentStats();

      return res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }
  }
}

module.exports = RecruitmentController;