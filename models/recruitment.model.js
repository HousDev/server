// models/recruitment.model.js
const { promisePool } = require("../config/db");
const crypto = require("crypto");

const RecruitmentModel = {
  // JOBS
  getAllJobs: async (filters = {}) => {
    let query = `SELECT * FROM recruitment_jobs WHERE 1=1`;
    const params = [];

    if (filters.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }

    if (filters.department_id) {
      query += " AND department_id = ?";
      params.push(filters.department_id);
    }

    if (filters.search) {
      query += " AND (job_title LIKE ? OR location LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += " ORDER BY created_at DESC";

    if (filters.limit) {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
    }

    const [rows] = await promisePool.query(query, params);
    return rows;
  },

  getJobById: async (id) => {
    const [rows] = await promisePool.query(
      "SELECT * FROM recruitment_jobs WHERE id = ?",
      [id],
    );
    return rows[0];
  },

  createJob: async (jobData) => {
    const [result] = await promisePool.query(
      "INSERT INTO recruitment_jobs SET ?",
      jobData,
    );
    return { id: result.insertId, ...jobData };
  },

  updateJobStatus: async (id, status) => {
    const [result] = await promisePool.query(
      "UPDATE recruitment_jobs SET status = ? WHERE id = ?",
      [status, id],
    );
    return result.affectedRows > 0;
  },

  updateJobStats: async (jobId, field, increment = 1) => {
    const validFields = [
      "total_applications",
      "shortlisted",
      "interviews",
      "selected",
      "offers_sent",
      "hired",
      "share_link_views",
      "share_link_applications",
    ];

    if (!validFields.includes(field)) {
      throw new Error("Invalid field for stats update");
    }

    const [result] = await promisePool.query(
      `UPDATE recruitment_jobs SET ${field} = ${field} + ? WHERE id = ?`,
      [increment, jobId],
    );
    return result.affectedRows > 0;
  },

  // APPLICATIONS
  getApplicationsByJob: async (jobId, filters = {}) => {
    let query = `SELECT * FROM recruitment_applications WHERE job_id = ?`;
    const params = [jobId];

    if (filters.interview_stage) {
      query += " AND interview_stage = ?";
      params.push(filters.interview_stage);
    }

    if (filters.offer_status) {
      query += " AND offer_status = ?";
      params.push(filters.offer_status);
    }

    if (filters.search) {
      query += " AND (applicant_name LIKE ? OR applicant_email LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += " ORDER BY applied_date DESC";

    if (filters.limit) {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
    }

    const [rows] = await promisePool.query(query, params);
    return rows;
  },

  getApplicationById: async (id) => {
    const [rows] = await promisePool.query(
      "SELECT * FROM recruitment_applications WHERE id = ?",
      [id],
    );
    return rows[0];
  },

  createApplication: async (applicationData) => {
    const [result] = await promisePool.query(
      "INSERT INTO recruitment_applications SET ?",
      applicationData,
    );
    return { id: result.insertId, ...applicationData };
  },

  updateApplicationStage: async (id, interview_stage) => {
    const [result] = await promisePool.query(
      "UPDATE recruitment_applications SET interview_stage = ?, stage_changed_date = NOW() WHERE id = ?",
      [interview_stage, id],
    );
    return result.affectedRows > 0;
  },

  updateApplicationOffer: async (id, offerData) => {
    const [result] = await promisePool.query(
      "UPDATE recruitment_applications SET ? WHERE id = ?",
      [offerData, id],
    );
    return result.affectedRows > 0;
  },

  // REFERRALS
  createReferral: async (referralData) => {
    const [result] = await promisePool.query(
      "INSERT INTO recruitment_referrals SET ?",
      referralData,
    );
    return { id: result.insertId, ...referralData };
  },

  getReferralsByJob: async (jobId) => {
    const [rows] = await promisePool.query(
      "SELECT * FROM recruitment_referrals WHERE job_id = ? ORDER BY created_at DESC",
      [jobId],
    );
    return rows;
  },

  updateReferralStatus: async (id, status, applicationId = null) => {
    const updateData = { status };
    if (applicationId) {
      updateData.application_id = applicationId;
    }

    const [result] = await promisePool.query(
      "UPDATE recruitment_referrals SET ? WHERE id = ?",
      [updateData, id],
    );
    return result.affectedRows > 0;
  },

  // SHARE LINKS
  generateShareLink: async (jobId, userId, userName) => {
    const hash = crypto.randomBytes(32).toString("hex");

    const [result] = await promisePool.query(
      "UPDATE recruitment_jobs SET share_link_hash = ?, created_by = ?, created_by_name = ? WHERE id = ?",
      [hash, userId, userName, jobId],
    );

    if (result.affectedRows > 0) {
      return hash;
    }
    return null;
  },

  getJobByShareLink: async (hash) => {
    const [rows] = await promisePool.query(
      "SELECT * FROM recruitment_jobs WHERE share_link_hash = ?",
      [hash],
    );

    if (rows.length > 0) {
      // Increment views
      await promisePool.query(
        "UPDATE recruitment_jobs SET share_link_views = share_link_views + 1 WHERE id = ?",
        [rows[0].id],
      );
    }

    return rows[0];
  },

  // STATISTICS
  getRecruitmentStats: async () => {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM recruitment_jobs WHERE status = 'open') as open_positions,
        (SELECT COUNT(*) FROM recruitment_jobs) as total_postings,
        (SELECT COUNT(*) FROM recruitment_applications WHERE interview_stage = 'interview_scheduled') as in_interview,
        (SELECT COUNT(*) FROM recruitment_applications WHERE interview_stage = 'selected') as offers_made,
        (SELECT COUNT(*) FROM recruitment_applications WHERE status = 'active') as total_applications,
        (SELECT COUNT(*) FROM recruitment_referrals WHERE status = 'hired') as referrals_hired
    `;

    const [rows] = await promisePool.query(query);
    return rows[0];
  },
};

module.exports = RecruitmentModel;
