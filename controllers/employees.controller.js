
// // backend/controllers/employees.controller.js
// const upload = require("../middleware/upload");
// const HrmsEmployee = require("../models/employees.model");
// const fs = require("fs");
// const path = require("path");

// /**
//  * Get all employees
//  */
// // In backend/controllers/employees.controller.js
// exports.getAllEmployees = async (req, res) => {
//   try {
//     const employees = await HrmsEmployee.findAll();
//     console.log("Fetched employees from DB:", employees.length);
    
//     // Make sure we're returning an array
//     if (Array.isArray(employees)) {
//       res.json(employees);
//     } else {
//       console.error("Employees is not an array:", employees);
//       res.json([]);
//     }
//   } catch (error) {
//     console.error("Get employees error:", error);
//     res.status(500).json({ message: "Failed to fetch employees" });
//   }
// };

// /**
//  * Get employee by ID
//  */
// exports.getEmployeeById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const employee = await HrmsEmployee.findById(id);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     res.json(employee);
//   } catch (error) {
//     console.error("Get employee by ID error:", error);
//     res.status(500).json({ message: "Failed to fetch employee" });
//   }
// };

// /**
//  * Get employee by email
//  */
// exports.getEmployeeByEmail = async (req, res) => {
//   try {
//     const { email } = req.params;

//     const employee = await HrmsEmployee.findByEmail(email);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     res.json(employee);
//   } catch (error) {
//     console.error("Get employee by email error:", error);
//     res.status(500).json({ message: "Failed to fetch employee" });
//   }
// };

// /**
//  * Create employee with profile picture
//  */
// exports.createEmployee = async (req, res) => {
//   try {
//     // Handle file upload
//     upload.single('profile_picture')(req, res, async function(err) {
//       if (err) {
//         return res.status(400).json({ message: err.message });
//       }

//       const {
//         first_name,
//         last_name,
//         email,
//         phone,
//         role_id,
//         department_id,
//         designation,
//         joining_date,
//         gender,
//         allotted_project,
//         office_location,
//         attendence_location,
//       } = req.body;

//       // Basic validation (same as before)
//       if (
//         !first_name ||
//         !last_name ||
//         !email ||
//         !phone ||
//         !role_id ||
//         !department_id ||
//         !designation ||
//         !joining_date ||
//         !gender ||
//         !allotted_project ||
//         !attendence_location
//       ) {
//         // Delete uploaded file if validation fails
//         if (req.file) {
//           fs.unlinkSync(req.file.path);
//         }
//         return res.status(400).json({
//           message: "All required fields must be provided",
//         });
//       }

//       // Prevent duplicate email
//       const existing = await HrmsEmployee.findByEmail(email);
//       if (existing) {
//         // Delete uploaded file if email exists
//         if (req.file) {
//           fs.unlinkSync(req.file.path);
//         }
//         return res.status(409).json({
//           message: "Employee with this email already exists",
//         });
//       }

//       // Prepare employee data with profile picture path
//       const employeeData = {
//         first_name,
//         last_name,
//         email,
//         phone,
//         role_id,
//         department_id,
//         designation,
//         joining_date,
//         gender,
//         allotted_project,
//         office_location: office_location || null,
//         attendence_location,
//         profile_picture: req.file ? `/uploads/${req.file.filename}` : null
//       };

//       const employee = await HrmsEmployee.create(employeeData);
//       res.status(201).json(employee);
//     });
//   } catch (error) {
//     console.error("Create employee error:", error);
//     res.status(500).json({ message: "Failed to create employee" });
//   }
// };

// /**
//  * Update employee with profile picture
//  */
// exports.updateEmployee = async (req, res) => {
//   try {
//     // Handle file upload
//     upload.single('profile_picture')(req, res, async function(err) {
//       if (err) {
//         return res.status(400).json({ message: err.message });
//       }

//       const { id } = req.params;

//       const employee = await HrmsEmployee.findById(id);
//       if (!employee) {
//         if (req.file) {
//           fs.unlinkSync(req.file.path);
//         }
//         return res.status(404).json({ message: "Employee not found" });
//       }

//       // If email is being updated, check uniqueness
//       if (req.body.email && req.body.email !== employee.email) {
//         const existing = await HrmsEmployee.findByEmail(req.body.email);
//         if (existing) {
//           if (req.file) {
//             fs.unlinkSync(req.file.path);
//           }
//           return res.status(409).json({
//             message: "Email already in use by another employee",
//           });
//         }
//       }

//       // Prepare update data with profile picture
//       const updateData = { ...req.body };
//       if (req.file) {
//         // Delete old profile picture if exists
//         if (employee.profile_picture) {
//           const oldPath = path.join(__dirname, '..', employee.profile_picture);
//           if (fs.existsSync(oldPath)) {
//             fs.unlinkSync(oldPath);
//           }
//         }
//         updateData.profile_picture = `/uploads/${req.file.filename}`;
//       }

//       const updated = await HrmsEmployee.update(id, updateData);
//       res.json(updated);
//     });
//   } catch (error) {
//     console.error("Update employee error:", error);
//     res.status(500).json({ message: "Failed to update employee" });
//   }
// };



// // backend/controllers/employees.controller.js - Update createEmployeeFromUser

// exports.createEmployeeFromUser = async (req, res) => {
//   try {
//     let {
//       first_name,
//       last_name,
//       email,
//       phone,
//       role_id,
//       department_id,
//       designation,
//       joining_date,
//       gender,
//       allotted_project,
//       office_location,
//       attendence_location,
//       profile_picture = null
//       // REMOVED: employee_status, employee_code, user_id
//     } = req.body;

//     console.log("Received employee data:", req.body);

//     // If last_name is empty, use first_name
//     if (!last_name || last_name.trim() === '') {
//       last_name = first_name;
//     }

//     // Basic validation
//     if (!first_name || !email || !phone || !designation || 
//         !joining_date || !gender || !attendence_location) {
      
//       const missing = [];
//       if (!first_name) missing.push('first_name');
//       if (!email) missing.push('email');
//       if (!phone) missing.push('phone');
//       if (!designation) missing.push('designation');
//       if (!joining_date) missing.push('joining_date');
//       if (!gender) missing.push('gender');
//       if (!attendence_location) missing.push('attendence_location');
      
//       console.error("Missing fields:", missing);
      
//       return res.status(400).json({
//         success: false,
//         message: `Missing required fields: ${missing.join(', ')}`,
//       });
//     }

//     // Check for duplicate email
//     const existing = await HrmsEmployee.findByEmail(email);
//     if (existing) {
//       console.log("Duplicate email found:", email);
//       return res.status(409).json({
//         success: false,
//         message: "Employee with this email already exists",
//       });
//     }

//     // Prepare employee data - ONLY columns that exist in your table
//     const employeeData = {
//       first_name,
//       last_name,
//       email,
//       phone,
//       role_id: role_id || null,
//       department_id: department_id || null,
//       designation,
//       joining_date,
//       gender,
//       allotted_project: allotted_project || null,
//       office_location: office_location || null,
//       attendence_location,
//       profile_picture: profile_picture || null
//     };

//     console.log("Creating employee with data:", employeeData);

//     const employee = await HrmsEmployee.create(employeeData);
    
//     console.log("Employee created successfully:", employee);
    
//     res.status(201).json({
//       success: true,
//       data: employee,
//       message: "Employee created successfully"
//     });
//   } catch (error) {
//     console.error("Create employee from user FULL ERROR:", error);
//     console.error("Error stack:", error.stack);
//     res.status(500).json({ 
//       success: false,
//       message: "Failed to create employee",
//       error: error.message
//     });
//   }
// };


// /**
//  * Delete employee
//  */
// exports.deleteEmployee = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const employee = await HrmsEmployee.findById(id);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     // Delete profile picture if exists
//     if (employee.profile_picture) {
//       const filePath = path.join(__dirname, '..', employee.profile_picture);
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     }

//     await HrmsEmployee.remove(id);
//     res.json({ success: true, message: "Employee deleted successfully" });
//   } catch (error) {
//     console.error("Delete employee error:", error);
//     res.status(500).json({ message: "Failed to delete employee" });
//   }
// };




// // backend/controllers/employees.controller.js
// const upload = require("../middleware/upload");
// const HrmsEmployee = require("../models/employees.model");
// const fs = require("fs");
// const path = require("path");

// /**
//  * Get all employees
//  */
// exports.getAllEmployees = async (req, res) => {
//   try {
//     const employees = await HrmsEmployee.findAll();
//     console.log("Fetched employees from DB:", employees.length);
    
//     if (Array.isArray(employees)) {
//       res.json(employees);
//     } else {
//       console.error("Employees is not an array:", employees);
//       res.json([]);
//     }
//   } catch (error) {
//     console.error("Get employees error:", error);
//     res.status(500).json({ message: "Failed to fetch employees" });
//   }
// };

// /**
//  * Get employee by ID
//  */
// exports.getEmployeeById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const employee = await HrmsEmployee.findById(id);
    
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     res.json(employee);
//   } catch (error) {
//     console.error("Get employee by ID error:", error);
//     res.status(500).json({ message: "Failed to fetch employee" });
//   }
// };

// /**
//  * Get employee by email
//  */
// exports.getEmployeeByEmail = async (req, res) => {
//   try {
//     const { email } = req.params;
//     const employee = await HrmsEmployee.findByEmail(email);
    
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     res.json(employee);
//   } catch (error) {
//     console.error("Get employee by email error:", error);
//     res.status(500).json({ message: "Failed to fetch employee" });
//   }
// };

// /**
//  * Create employee with comprehensive data
//  */
// exports.createEmployee = async (req, res) => {
//   try {
//     upload.single('profile_picture')(req, res, async function(err) {
//       if (err) {
//         return res.status(400).json({ message: err.message });
//       }

//       console.log("Received employee data:", req.body);
//       console.log("Files:", req.file);

//       // Parse JSON fields that were stringified
//       const parseField = (field) => {
//         if (typeof field === 'string' && (field.startsWith('[') || field.startsWith('{'))) {
//           try {
//             return JSON.parse(field);
//           } catch {
//             return field;
//           }
//         }
//         return field;
//       };

//       // Parse allotted_project if it's a JSON string
//     let allotted_project = req.body.allotted_project;
// if (typeof allotted_project === 'string') {
//   try {
//     allotted_project = JSON.parse(allotted_project);
//   } catch {
//     // Keep as string if not valid JSON
//   }
// }

//       // If it's an array, take the first value (frontend sends array, backend expects single value)
//       if (Array.isArray(allotted_project)) {
//   allotted_project = allotted_project.length > 0 ? allotted_project[0] : 0; // Change null to 0
// }

//       // Basic required fields validation
//       const requiredFields = [
//         'first_name',
//         'last_name', 
//         'email',
//         'phone',
//         'role_id',
//         'department_id',
//         'designation',
//         'joining_date',
//         'gender',
//         'attendence_location'
//       ];

//       const missingFields = requiredFields.filter(field => !req.body[field]);
      
//       if (missingFields.length > 0) {
//         if (req.file) {
//           fs.unlinkSync(req.file.path);
//         }
//         return res.status(400).json({
//           message: `Missing required fields: ${missingFields.join(', ')}`,
//           missingFields
//         });
//       }

//       // Prevent duplicate email
//       const existing = await HrmsEmployee.findByEmail(req.body.email);
//       if (existing) {
//         if (req.file) {
//           fs.unlinkSync(req.file.path);
//         }
//         return res.status(409).json({
//           message: "Employee with this email already exists",
//         });
//       }

//       // Prepare comprehensive employee data
//       const employeeData = {
//         // Basic Details
//         first_name: req.body.first_name,
//           middle_name: req.body.middle_name || null, // Add middle_name

//         last_name: req.body.last_name,
//         email: req.body.email,
//         phone: req.body.phone,
//         role_id: req.body.role_id,
//         department_id: req.body.department_id,
//         designation: req.body.designation,
//         joining_date: req.body.joining_date,
//         gender: req.body.gender,
//         allotted_project: allotted_project || null,
//         attendence_location: req.body.attendence_location,
//         profile_picture: req.file ? `/uploads/${req.file.filename}` : null,
        
//         // Personal Details
//         blood_group: req.body.blood_group || null,
//         date_of_birth: req.body.date_of_birth || null,
//         marital_status: req.body.marital_status || null,
//         emergency_contact: req.body.emergency_contact || null,
//         emergency_contact_relationship: req.body.emergency_contact_relationship || null, // Add
//   emergency_contact_name: req.body.emergency_contact_name || null, // Add
//         nationality: req.body.nationality || 'Indian',
        
//         // Address Details
//         current_address: req.body.current_address || null,
//         permanent_address: req.body.permanent_address || null,
//         city: req.body.city || null,
//         state: req.body.state || null,
//         pincode: req.body.pincode || null,
//         same_as_permanent: req.body.same_as_permanent === 'true' || req.body.same_as_permanent === true,
        
//         // Identification
//         aadhar_number: req.body.aadhar_number || null,
//         pan_number: req.body.pan_number || null,
        
//         // Educational Details
//         highest_qualification: req.body.highest_qualification || null,
//         university: req.body.university || null,
//         passing_year: req.body.passing_year || null,
//         percentage: req.body.percentage || null,
        
//         // Employment Details
//         employee_type: req.body.employee_type || 'permanent',
//         probation_period: req.body.probation_period || null,
//         work_mode: req.body.work_mode || 'office',
//         date_of_leaving: req.body.date_of_leaving || null,
//         notice_period: req.body.notice_period || '30',
//           salary: req.body.salary || null,
//   salary_type: req.body.salary_type || 'monthly',

//         // System Details
//         laptop_assigned: req.body.laptop_assigned || 'no',
//         system_login_id: req.body.system_login_id || null,
//         system_password: req.body.system_password || null,
//         office_email_id: req.body.office_email_id || null,
//         office_email_password: req.body.office_email_password || null,
        
//         // Bank Details
//         bank_account_number: req.body.bank_account_number || null,
//         bank_name: req.body.bank_name || null,
//         ifsc_code: req.body.ifsc_code || null,
//         upi_id: req.body.upi_id || null,
        
//         // Status (default to active)
//         employee_status: 'active'
//       };

//       console.log("Creating employee with data:", employeeData);

//       const employee = await HrmsEmployee.create(employeeData);
      
//       // Generate employee code after creation
//       const employeeCode = `EMP${String(employee.id).padStart(4, '0')}`;
//       await HrmsEmployee.update(employee.id, { employee_code: employeeCode });
      
//       employee.employee_code = employeeCode;
      
//       res.status(201).json(employee);
//     });
//   } catch (error) {
//     console.error("Create employee error:", error);
//     console.error("Error stack:", error.stack);
    
//     // Clean up uploaded file if error occurred
//     if (req.file && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }
    
//     res.status(500).json({ 
//       message: "Failed to create employee",
//       error: error.message 
//     });
//   }
// };

// /**
//  * Update employee with comprehensive data
//  */
// /**
//  * Update employee with comprehensive data
//  */
// exports.updateEmployee = async (req, res) => {
//   try {
//     upload.single('profile_picture')(req, res, async function(err) {
//       if (err) {
//         return res.status(400).json({ message: err.message });
//       }

//       const { id } = req.params;
//       const employee = await HrmsEmployee.findById(id);
      
//       if (!employee) {
//         if (req.file) {
//           fs.unlinkSync(req.file.path);
//         }
//         return res.status(404).json({ message: "Employee not found" });
//       }

//       // Parse allotted_project if it's a JSON string array
//       let allotted_project = req.body.allotted_project;
//       if (typeof allotted_project === 'string') {
//         try {
//           allotted_project = JSON.parse(allotted_project);
//         } catch {
//           // Keep as string if not valid JSON
//         }
//       }

//       // Handle array for allotted_project - take first item if it's an array
//       let final_allotted_project = null;
//       if (Array.isArray(allotted_project) && allotted_project.length > 0) {
//         // Take the first project ID from array
//         final_allotted_project = parseInt(allotted_project[0]) || null;
//       } else if (allotted_project !== undefined && allotted_project !== null && allotted_project !== '') {
//         // Single value
//         final_allotted_project = parseInt(allotted_project) || null;
//       } else {
//         // Keep existing value if not provided
//         final_allotted_project = employee.allotted_project;
//       }

//       // Handle attendance_location array
//       let attendence_location = req.body.attendence_location;
//       if (typeof attendence_location === 'string') {
//         try {
//           attendence_location = JSON.parse(attendence_location);
//         } catch {
//           // If it's a comma-separated string, split it
//           if (attendence_location.includes(',')) {
//             attendence_location = attendence_location.split(',').map(loc => loc.trim()).filter(Boolean);
//           }
//         }
//       }

//       // Convert array to string for database if it's an array
//       let final_attendence_location = attendence_location;
//       if (Array.isArray(attendence_location)) {
//         final_attendence_location = JSON.stringify(attendence_location);
//       } else if (attendence_location === undefined || attendence_location === null) {
//         // Keep existing value if not provided
//         final_attendence_location = employee.attendence_location;
//       }

//       // If email is being updated, check uniqueness
//       if (req.body.email && req.body.email !== employee.email) {
//         const existing = await HrmsEmployee.findByEmail(req.body.email);
//         if (existing) {
//           if (req.file) {
//             fs.unlinkSync(req.file.path);
//           }
//           return res.status(409).json({
//             message: "Email already in use by another employee",
//           });
//         }
//       }

//       // Prepare update data - ALWAYS use existing values as fallback
//       const updateData = {
//         // Basic Details
//         first_name: req.body.first_name !== undefined ? req.body.first_name : employee.first_name,
//         middle_name: req.body.middle_name !== undefined ? req.body.middle_name : employee.middle_name,
//         last_name: req.body.last_name !== undefined ? req.body.last_name : employee.last_name,
//         email: req.body.email !== undefined ? req.body.email : employee.email,
//         phone: req.body.phone !== undefined ? req.body.phone : employee.phone,
//         role_id: req.body.role_id !== undefined ? req.body.role_id : employee.role_id,
//         department_id: req.body.department_id !== undefined ? req.body.department_id : employee.department_id,
//         designation: req.body.designation !== undefined ? req.body.designation : employee.designation,
//         designation_id: req.body.designation_id !== undefined ? req.body.designation_id : employee.designation_id,
//         joining_date: req.body.joining_date !== undefined ? req.body.joining_date : employee.joining_date,
//         gender: req.body.gender !== undefined ? req.body.gender : employee.gender,
//         allotted_project: final_allotted_project,
//         attendence_location: final_attendence_location,
//         company_id: req.body.company_id !== undefined ? req.body.company_id : employee.company_id,
        
//         // Personal Details
//         blood_group: req.body.blood_group !== undefined ? req.body.blood_group : employee.blood_group,
//         date_of_birth: req.body.date_of_birth !== undefined ? req.body.date_of_birth : employee.date_of_birth,
//         marital_status: req.body.marital_status !== undefined ? req.body.marital_status : employee.marital_status,
//         emergency_contact: req.body.emergency_contact !== undefined ? req.body.emergency_contact : employee.emergency_contact,
//         emergency_contact_relationship: req.body.emergency_contact_relationship !== undefined ? req.body.emergency_contact_relationship : employee.emergency_contact_relationship,
//         emergency_contact_name: req.body.emergency_contact_name !== undefined ? req.body.emergency_contact_name : employee.emergency_contact_name,
//         nationality: req.body.nationality !== undefined ? req.body.nationality : employee.nationality,
        
//         // Address Details
//         current_address: req.body.current_address !== undefined ? req.body.current_address : employee.current_address,
//         permanent_address: req.body.permanent_address !== undefined ? req.body.permanent_address : employee.permanent_address,
//         city: req.body.city !== undefined ? req.body.city : employee.city,
//         state: req.body.state !== undefined ? req.body.state : employee.state,
//         pincode: req.body.pincode !== undefined ? req.body.pincode : employee.pincode,
//         same_as_permanent: req.body.same_as_permanent !== undefined 
//           ? (req.body.same_as_permanent === 'true' || req.body.same_as_permanent === true)
//           : employee.same_as_permanent,
        
//         // Identification
//         aadhar_number: req.body.aadhar_number !== undefined ? req.body.aadhar_number : employee.aadhar_number,
//         pan_number: req.body.pan_number !== undefined ? req.body.pan_number : employee.pan_number,
        
//         // Educational Details
//         highest_qualification: req.body.highest_qualification !== undefined ? req.body.highest_qualification : employee.highest_qualification,
//         university: req.body.university !== undefined ? req.body.university : employee.university,
//         passing_year: req.body.passing_year !== undefined ? req.body.passing_year : employee.passing_year,
//         percentage: req.body.percentage !== undefined ? req.body.percentage : employee.percentage,
        
//         // Employment Details
//         employee_type: req.body.employee_type !== undefined ? req.body.employee_type : employee.employee_type,
//         probation_period: req.body.probation_period !== undefined ? req.body.probation_period : employee.probation_period,
//         work_mode: req.body.work_mode !== undefined ? req.body.work_mode : employee.work_mode,
//         date_of_leaving: req.body.date_of_leaving !== undefined ? req.body.date_of_leaving : employee.date_of_leaving,
//         notice_period: req.body.notice_period !== undefined ? req.body.notice_period : employee.notice_period,
//         salary: req.body.salary !== undefined ? req.body.salary : employee.salary,
//         salary_type: req.body.salary_type !== undefined ? req.body.salary_type : employee.salary_type,
        
//         // System Details
//         laptop_assigned: req.body.laptop_assigned !== undefined ? req.body.laptop_assigned : employee.laptop_assigned,
//         system_login_id: req.body.system_login_id !== undefined ? req.body.system_login_id : employee.system_login_id,
//         system_password: req.body.system_password !== undefined ? req.body.system_password : employee.system_password,
//         office_email_id: req.body.office_email_id !== undefined ? req.body.office_email_id : employee.office_email_id,
//         office_email_password: req.body.office_email_password !== undefined ? req.body.office_email_password : employee.office_email_password,
        
//         // Bank Details
//         bank_account_number: req.body.bank_account_number !== undefined ? req.body.bank_account_number : employee.bank_account_number,
//         bank_name: req.body.bank_name !== undefined ? req.body.bank_name : employee.bank_name,
//         ifsc_code: req.body.ifsc_code !== undefined ? req.body.ifsc_code : employee.ifsc_code,
//         upi_id: req.body.upi_id !== undefined ? req.body.upi_id : employee.upi_id,
        
//         // Status
//         employee_status: req.body.employee_status !== undefined ? req.body.employee_status : employee.employee_status
//       };

//       // Handle profile picture
//       if (req.file) {
//         // Delete old profile picture if exists
//         if (employee.profile_picture) {
//           const oldPath = path.join(__dirname, '..', employee.profile_picture);
//           if (fs.existsSync(oldPath)) {
//             fs.unlinkSync(oldPath);
//           }
//         }
//         updateData.profile_picture = `/uploads/${req.file.filename}`;
//       }

//       console.log("Updating employee with data:", updateData);

//       const updated = await HrmsEmployee.update(id, updateData);
//       res.json(updated);
//     });
//   } catch (error) {
//     console.error("Update employee error:", error);
//     console.error("Error stack:", error.stack);
    
//     // Clean up uploaded file if error occurred
//     if (req.file && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }
    
//     res.status(500).json({ 
//       message: "Failed to update employee",
//       error: error.message 
//     });
//   }
// };

// /**
//  * Update only additional details (for AddMoreDetailsModal)
//  */
// exports.updateAdditionalDetails = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const employee = await HrmsEmployee.findById(id);
    
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     // Only update additional fields, not basic info
//     const updateData = {
//       // Personal Details
//       blood_group: req.body.blood_group !== undefined ? req.body.blood_group : employee.blood_group,
//       date_of_birth: req.body.date_of_birth !== undefined ? req.body.date_of_birth : employee.date_of_birth,
//       marital_status: req.body.marital_status !== undefined ? req.body.marital_status : employee.marital_status,
//       emergency_contact: req.body.emergency_contact !== undefined ? req.body.emergency_contact : employee.emergency_contact,
//       nationality: req.body.nationality !== undefined ? req.body.nationality : employee.nationality,
      
//       // Address Details
//       current_address: req.body.current_address !== undefined ? req.body.current_address : employee.current_address,
//       permanent_address: req.body.permanent_address !== undefined ? req.body.permanent_address : employee.permanent_address,
//       city: req.body.city !== undefined ? req.body.city : employee.city,
//       state: req.body.state !== undefined ? req.body.state : employee.state,
//       pincode: req.body.pincode !== undefined ? req.body.pincode : employee.pincode,
//       same_as_permanent: req.body.same_as_permanent !== undefined 
//         ? (req.body.same_as_permanent === 'true' || req.body.same_as_permanent === true)
//         : employee.same_as_permanent,
      
//       // Identification
//       aadhar_number: req.body.aadhar_number !== undefined ? req.body.aadhar_number : employee.aadhar_number,
//       pan_number: req.body.pan_number !== undefined ? req.body.pan_number : employee.pan_number,
      
//       // Educational Details
//       highest_qualification: req.body.highest_qualification !== undefined ? req.body.highest_qualification : employee.highest_qualification,
//       university: req.body.university !== undefined ? req.body.university : employee.university,
//       passing_year: req.body.passing_year !== undefined ? req.body.passing_year : employee.passing_year,
//       percentage: req.body.percentage !== undefined ? req.body.percentage : employee.percentage,
      
//       // Employment Details
//       employee_type: req.body.employee_type !== undefined ? req.body.employee_type : employee.employee_type,
//       branch: req.body.branch !== undefined ? req.body.branch : employee.branch,
//       probation_period: req.body.probation_period !== undefined ? req.body.probation_period : employee.probation_period,
//       work_mode: req.body.work_mode !== undefined ? req.body.work_mode : employee.work_mode,
//       date_of_leaving: req.body.date_of_leaving !== undefined ? req.body.date_of_leaving : employee.date_of_leaving,
//       job_title: req.body.job_title !== undefined ? req.body.job_title : employee.job_title,
//       notice_period: req.body.notice_period !== undefined ? req.body.notice_period : employee.notice_period,
//        salary: req.body.salary !== undefined ? req.body.salary : employee.salary,
//   salary_type: req.body.salary_type !== undefined ? req.body.salary_type : employee.salary_type,
//       // System Details
//       laptop_assigned: req.body.laptop_assigned !== undefined ? req.body.laptop_assigned : employee.laptop_assigned,
//       system_login_id: req.body.system_login_id !== undefined ? req.body.system_login_id : employee.system_login_id,
//       system_password: req.body.system_password !== undefined ? req.body.system_password : employee.system_password,
//       office_email_id: req.body.office_email_id !== undefined ? req.body.office_email_id : employee.office_email_id,
//       office_email_password: req.body.office_email_password !== undefined ? req.body.office_email_password : employee.office_email_password,
      
//       // Bank Details
//       bank_account_number: req.body.bank_account_number !== undefined ? req.body.bank_account_number : employee.bank_account_number,
//       bank_name: req.body.bank_name !== undefined ? req.body.bank_name : employee.bank_name,
//       ifsc_code: req.body.ifsc_code !== undefined ? req.body.ifsc_code : employee.ifsc_code,
//       upi_id: req.body.upi_id !== undefined ? req.body.upi_id : employee.upi_id,
//     };

//     console.log("Updating additional details:", updateData);

//     const updated = await HrmsEmployee.update(id, updateData);
//     res.json({
//       success: true,
//       message: "Additional details updated successfully",
//       data: updated
//     });
//   } catch (error) {
//     console.error("Update additional details error:", error);
//     res.status(500).json({ 
//       success: false,
//       message: "Failed to update additional details",
//       error: error.message 
//     });
//   }
// };

// /**
//  * Create employee from user (simplified)
//  */
// exports.createEmployeeFromUser = async (req, res) => {
//   try {
//     let {
//       first_name,
//       last_name,
//       email,
//       phone,
//       role_id,
//       department_id,
//       designation,
//       joining_date,
//       gender,
//       allotted_project,
//       office_location,
//       attendence_location,
//       profile_picture = null
//     } = req.body;

//     console.log("Received employee data:", req.body);

//     // If last_name is empty, use first_name
//     if (!last_name || last_name.trim() === '') {
//       last_name = first_name;
//     }

//     // Basic validation
//     const requiredFields = {
//       'first_name': first_name,
//       'email': email,
//       'phone': phone,
//       'designation': designation,
//       'joining_date': joining_date,
//       'gender': gender,
//       'attendence_location': attendence_location
//     };

//     const missingFields = Object.entries(requiredFields)
//       .filter(([key, value]) => !value)
//       .map(([key]) => key);

//     if (missingFields.length > 0) {
//       console.error("Missing fields:", missingFields);
//       return res.status(400).json({
//         success: false,
//         message: `Missing required fields: ${missingFields.join(', ')}`,
//       });
//     }

//     // Check for duplicate email
//     const existing = await HrmsEmployee.findByEmail(email);
//     if (existing) {
//       console.log("Duplicate email found:", email);
//       return res.status(409).json({
//         success: false,
//         message: "Employee with this email already exists",
//       });
//     }

//     // Prepare employee data
//     const employeeData = {
//       first_name,
//       last_name,
//       email,
//       phone,
//       role_id: role_id || null,
//       department_id: department_id || null,
//       designation,
//       joining_date,
//       gender,
//       allotted_project: allotted_project || null,
//       office_location: office_location || null,
//       attendence_location,
//       profile_picture: profile_picture || null,
//       employee_status: 'active',
//         salary: req.body.salary || null,
//   salary_type: req.body.salary_type || 'monthly',
//     };

//     console.log("Creating employee from user with data:", employeeData);

//     const employee = await HrmsEmployee.create(employeeData);
    
//     // Generate employee code
//     const employeeCode = `EMP${String(employee.id).padStart(4, '0')}`;
//     await HrmsEmployee.update(employee.id, { employee_code: employeeCode });
    
//     employee.employee_code = employeeCode;
    
//     console.log("Employee created successfully:", employee);
    
//     res.status(201).json({
//       success: true,
//       data: employee,
//       message: "Employee created successfully"
//     });
//   } catch (error) {
//     console.error("Create employee from user FULL ERROR:", error);
//     console.error("Error stack:", error.stack);
//     res.status(500).json({ 
//       success: false,
//       message: "Failed to create employee",
//       error: error.message
//     });
//   }
// };

// /**
//  * Delete employee
//  */
// exports.deleteEmployee = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const employee = await HrmsEmployee.findById(id);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     // Delete profile picture if exists
//     if (employee.profile_picture) {
//       const filePath = path.join(__dirname, '..', employee.profile_picture);
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     }

//     await HrmsEmployee.remove(id);
//     res.json({ success: true, message: "Employee deleted successfully" });
//   } catch (error) {
//     console.error("Delete employee error:", error);
//     res.status(500).json({ message: "Failed to delete employee" });
//   }
// };

// const upload = require("../middleware/upload");
// const HrmsEmployee = require("../models/employees.model");
// const fs = require("fs");
// const path = require("path");

// /**
//  * Get all employees
//  */
// exports.getAllEmployees = async (req, res) => {
//   try {
//     const employees = await HrmsEmployee.findAll();
//     console.log("Fetched employees from DB:", employees.length);
    
//     if (Array.isArray(employees)) {
//       res.json(employees);
//     } else {
//       console.error("Employees is not an array:", employees);
//       res.json([]);
//     }
//   } catch (error) {
//     console.error("Get employees error:", error);
//     res.status(500).json({ message: "Failed to fetch employees" });
//   }
// };

// /**
//  * Get employee by ID
//  */
// exports.getEmployeeById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const employee = await HrmsEmployee.findById(id);
    
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     res.json(employee);
//   } catch (error) {
//     console.error("Get employee by ID error:", error);
//     res.status(500).json({ message: "Failed to fetch employee" });
//   }
// };

// /**
//  * Get employee by email
//  */
// exports.getEmployeeByEmail = async (req, res) => {
//   try {
//     const { email } = req.params;
//     const employee = await HrmsEmployee.findByEmail(email);
    
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     res.json(employee);
//   } catch (error) {
//     console.error("Get employee by email error:", error);
//     res.status(500).json({ message: "Failed to fetch employee" });
//   }
// };

// /**
//  * Create employee with comprehensive data
//  */
// exports.createEmployee = async (req, res) => {
//   try {
//     upload.single('profile_picture')(req, res, async function(err) {
//       if (err) {
//         return res.status(400).json({ message: err.message });
//       }

//       console.log("Received employee data:", req.body);
//       console.log("Files:", req.file);

//       // Handle allotted_project as JSON array
//       let final_allotted_project = null;
//       if (req.body.allotted_project) {
//         if (typeof req.body.allotted_project === 'string') {
//           try {
//             const parsed = JSON.parse(req.body.allotted_project);
//             if (Array.isArray(parsed) && parsed.length > 0) {
//               // Validate project IDs exist before saving
//               final_allotted_project = JSON.stringify(parsed.map(id => parseInt(id)).filter(Boolean));
//             }
//           } catch {
//             // If it's a comma-separated string, convert to array
//             if (req.body.allotted_project.includes(',')) {
//               const projects = req.body.allotted_project.split(',').map(id => parseInt(id.trim())).filter(Boolean);
//               if (projects.length > 0) {
//                 final_allotted_project = JSON.stringify(projects);
//               }
//             } else {
//               // Single value
//               const num = parseInt(req.body.allotted_project);
//               if (!isNaN(num)) {
//                 final_allotted_project = JSON.stringify([num]);
//               }
//             }
//           }
//         } else if (Array.isArray(req.body.allotted_project) && req.body.allotted_project.length > 0) {
//           // Already an array from frontend
//           final_allotted_project = JSON.stringify(req.body.allotted_project.map(id => parseInt(id)).filter(Boolean));
//         }
//       }

//       // Handle attendance_location array
//       let final_attendence_location = null;
//       if (req.body.attendence_location) {
//         if (typeof req.body.attendence_location === 'string') {
//           try {
//             const parsed = JSON.parse(req.body.attendence_location);
//             if (Array.isArray(parsed) && parsed.length > 0) {
//               final_attendence_location = JSON.stringify(parsed);
//             }
//           } catch {
//             // If it's a comma-separated string, split it
//             if (req.body.attendence_location.includes(',')) {
//               const locations = req.body.attendence_location.split(',').map(loc => loc.trim()).filter(Boolean);
//               if (locations.length > 0) {
//                 final_attendence_location = JSON.stringify(locations);
//               }
//             } else if (req.body.attendence_location.trim() !== '') {
//               final_attendence_location = JSON.stringify([req.body.attendence_location.trim()]);
//             }
//           }
//         } else if (Array.isArray(req.body.attendence_location) && req.body.attendence_location.length > 0) {
//           final_attendence_location = JSON.stringify(req.body.attendence_location);
//         }
//       }

//       // Basic required fields validation
//       const requiredFields = [
//         'first_name',
//         'last_name', 
//         'email',
//         'phone',
//         'role_id',
//         'department_id',
//         'designation',
//         'joining_date',
//         'gender'
//       ];

//       const missingFields = requiredFields.filter(field => !req.body[field]);
      
//       if (missingFields.length > 0) {
//         if (req.file) {
//           fs.unlinkSync(req.file.path);
//         }
//         return res.status(400).json({
//           message: `Missing required fields: ${missingFields.join(', ')}`,
//           missingFields
//         });
//       }

//       // Prevent duplicate email
//       const existing = await HrmsEmployee.findByEmail(req.body.email);
//       if (existing) {
//         if (req.file) {
//           fs.unlinkSync(req.file.path);
//         }
//         return res.status(409).json({
//           message: "Employee with this email already exists",
//         });
//       }

//       // Prepare comprehensive employee data
//       const employeeData = {
//         // Basic Details
//         first_name: req.body.first_name,
//         middle_name: req.body.middle_name || null,
//         last_name: req.body.last_name,
//         email: req.body.email,
//         phone: req.body.phone,
//         role_id: req.body.role_id,
//         department_id: req.body.department_id,
//         designation: req.body.designation,
//         joining_date: req.body.joining_date,
//         gender: req.body.gender,
//         allotted_project: final_allotted_project,
//         attendence_location: final_attendence_location,
//         company_id: req.body.company_id || null,
//         profile_picture: req.file ? `/uploads/${req.file.filename}` : null,
        
//         // Personal Details
//         blood_group: req.body.blood_group || null,
//         date_of_birth: req.body.date_of_birth || null,
//         marital_status: req.body.marital_status || null,
//         emergency_contact: req.body.emergency_contact || null,
//         emergency_contact_relationship: req.body.emergency_contact_relationship || null,
//         emergency_contact_name: req.body.emergency_contact_name || null,
//         nationality: req.body.nationality || 'Indian',
        
//         // Address Details
//         current_address: req.body.current_address || null,
//         permanent_address: req.body.permanent_address || null,
//         city: req.body.city || null,
//         state: req.body.state || null,
//         pincode: req.body.pincode || null,
//         same_as_permanent: req.body.same_as_permanent === 'true' || req.body.same_as_permanent === true,
        
//         // Identification
//         aadhar_number: req.body.aadhar_number || null,
//         pan_number: req.body.pan_number || null,
        
//         // Educational Details
//         highest_qualification: req.body.highest_qualification || null,
//         university: req.body.university || null,
//         passing_year: req.body.passing_year || null,
//         percentage: req.body.percentage || null,
        
//         // Employment Details
//         employee_type: req.body.employee_type || 'permanent',
//         probation_period: req.body.probation_period || null,
//         work_mode: req.body.work_mode || 'office',
//         date_of_leaving: req.body.date_of_leaving || null,
//         notice_period: req.body.notice_period || '30',
//         salary: req.body.salary || null,
//         salary_type: req.body.salary_type || 'monthly',

//         // System Details
//         laptop_assigned: req.body.laptop_assigned || 'no',
//         system_login_id: req.body.system_login_id || null,
//         system_password: req.body.system_password || null,
//         office_email_id: req.body.office_email_id || null,
//         office_email_password: req.body.office_email_password || null,
        
//         // Bank Details
//         bank_account_number: req.body.bank_account_number || null,
//         bank_name: req.body.bank_name || null,
//         ifsc_code: req.body.ifsc_code || null,
//         upi_id: req.body.upi_id || null,
        
//         // Status (default to active)
//         employee_status: req.body.employee_status || 'active'
//       };

//       console.log("Creating employee with data:", employeeData);

//       const employee = await HrmsEmployee.create(employeeData);
      
//       // Generate employee code after creation
//       const employeeCode = `EMP${String(employee.id).padStart(4, '0')}`;
//       await HrmsEmployee.update(employee.id, { employee_code: employeeCode });
      
//       employee.employee_code = employeeCode;
      
//       res.status(201).json(employee);
//     });
//   } catch (error) {
//     console.error("Create employee error:", error);
//     console.error("Error stack:", error.stack);
    
//     // Clean up uploaded file if error occurred
//     if (req.file && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }
    
//     res.status(500).json({ 
//       message: "Failed to create employee",
//       error: error.message 
//     });
//   }
// };

// /**
//  * Update employee with comprehensive data
//  */
// exports.updateEmployee = async (req, res) => {
//   try {
//     upload.single('profile_picture')(req, res, async function(err) {
//       if (err) {
//         return res.status(400).json({ message: err.message });
//       }

//       const { id } = req.params;
//       const employee = await HrmsEmployee.findById(id);
      
//       if (!employee) {
//         if (req.file) {
//           fs.unlinkSync(req.file.path);
//         }
//         return res.status(404).json({ message: "Employee not found" });
//       }

//       // Handle allotted_project as JSON array
//       let final_allotted_project = undefined;
//       if (req.body.allotted_project !== undefined) {
//         if (typeof req.body.allotted_project === 'string') {
//           try {
//             const parsed = JSON.parse(req.body.allotted_project);
//             if (Array.isArray(parsed)) {
//               // Store as JSON array (empty array if no projects)
//               final_allotted_project = parsed.length > 0 
//                 ? JSON.stringify(parsed.map(id => parseInt(id)).filter(Boolean))
//                 : JSON.stringify([]);
//             }
//           } catch {
//             // If it's a comma-separated string, convert to array
//             if (req.body.allotted_project.includes(',')) {
//               const projects = req.body.allotted_project.split(',').map(id => parseInt(id.trim())).filter(Boolean);
//               final_allotted_project = JSON.stringify(projects);
//             } else if (req.body.allotted_project.trim() === '') {
//               // Empty string means no projects
//               final_allotted_project = JSON.stringify([]);
//             } else {
//               // Single value
//               const num = parseInt(req.body.allotted_project);
//               final_allotted_project = !isNaN(num) ? JSON.stringify([num]) : JSON.stringify([]);
//             }
//           }
//         } else if (Array.isArray(req.body.allotted_project)) {
//           // Already an array from frontend
//           final_allotted_project = JSON.stringify(req.body.allotted_project.map(id => parseInt(id)).filter(Boolean));
//         } else if (req.body.allotted_project === null || req.body.allotted_project === '') {
//           // Null or empty means no projects
//           final_allotted_project = JSON.stringify([]);
//         }
//       }

//       // Handle attendance_location array
//       let final_attendence_location = undefined;
//       if (req.body.attendence_location !== undefined) {
//         if (typeof req.body.attendence_location === 'string') {
//           try {
//             const parsed = JSON.parse(req.body.attendence_location);
//             if (Array.isArray(parsed)) {
//               final_attendence_location = parsed.length > 0 
//                 ? JSON.stringify(parsed)
//                 : JSON.stringify([]);
//             }
//           } catch {
//             // If it's a comma-separated string, split it
//             if (req.body.attendence_location.includes(',')) {
//               const locations = req.body.attendence_location.split(',').map(loc => loc.trim()).filter(Boolean);
//               final_attendence_location = JSON.stringify(locations);
//             } else if (req.body.attendence_location.trim() === '') {
//               final_attendence_location = JSON.stringify([]);
//             } else {
//               final_attendence_location = JSON.stringify([req.body.attendence_location.trim()]);
//             }
//           }
//         } else if (Array.isArray(req.body.attendence_location)) {
//           final_attendence_location = JSON.stringify(req.body.attendence_location);
//         } else if (req.body.attendence_location === null || req.body.attendence_location === '') {
//           final_attendence_location = JSON.stringify([]);
//         }
//       }

//       // If email is being updated, check uniqueness
//       if (req.body.email && req.body.email !== employee.email) {
//         const existing = await HrmsEmployee.findByEmail(req.body.email);
//         if (existing) {
//           if (req.file) {
//             fs.unlinkSync(req.file.path);
//           }
//           return res.status(409).json({
//             message: "Email already in use by another employee",
//           });
//         }
//       }

//       // Prepare update data - ALWAYS use existing values as fallback
//       const updateData = {
//         // Basic Details
//         first_name: req.body.first_name !== undefined ? req.body.first_name : employee.first_name,
//         middle_name: req.body.middle_name !== undefined ? req.body.middle_name : employee.middle_name,
//         last_name: req.body.last_name !== undefined ? req.body.last_name : employee.last_name,
//         email: req.body.email !== undefined ? req.body.email : employee.email,
//         phone: req.body.phone !== undefined ? req.body.phone : employee.phone,
//         role_id: req.body.role_id !== undefined ? req.body.role_id : employee.role_id,
//         department_id: req.body.department_id !== undefined ? req.body.department_id : employee.department_id,
//         designation: req.body.designation !== undefined ? req.body.designation : employee.designation,
//         joining_date: req.body.joining_date !== undefined ? req.body.joining_date : employee.joining_date,
//         gender: req.body.gender !== undefined ? req.body.gender : employee.gender,
//         company_id: req.body.company_id !== undefined ? req.body.company_id : employee.company_id,
        
//         // Personal Details
//         blood_group: req.body.blood_group !== undefined ? req.body.blood_group : employee.blood_group,
//         date_of_birth: req.body.date_of_birth !== undefined ? req.body.date_of_birth : employee.date_of_birth,
//         marital_status: req.body.marital_status !== undefined ? req.body.marital_status : employee.marital_status,
//         emergency_contact: req.body.emergency_contact !== undefined ? req.body.emergency_contact : employee.emergency_contact,
//         emergency_contact_relationship: req.body.emergency_contact_relationship !== undefined ? req.body.emergency_contact_relationship : employee.emergency_contact_relationship,
//         emergency_contact_name: req.body.emergency_contact_name !== undefined ? req.body.emergency_contact_name : employee.emergency_contact_name,
//         nationality: req.body.nationality !== undefined ? req.body.nationality : employee.nationality,
        
//         // Address Details
//         current_address: req.body.current_address !== undefined ? req.body.current_address : employee.current_address,
//         permanent_address: req.body.permanent_address !== undefined ? req.body.permanent_address : employee.permanent_address,
//         city: req.body.city !== undefined ? req.body.city : employee.city,
//         state: req.body.state !== undefined ? req.body.state : employee.state,
//         pincode: req.body.pincode !== undefined ? req.body.pincode : employee.pincode,
//         same_as_permanent: req.body.same_as_permanent !== undefined 
//           ? (req.body.same_as_permanent === 'true' || req.body.same_as_permanent === true)
//           : employee.same_as_permanent,
        
//         // Identification
//         aadhar_number: req.body.aadhar_number !== undefined ? req.body.aadhar_number : employee.aadhar_number,
//         pan_number: req.body.pan_number !== undefined ? req.body.pan_number : employee.pan_number,
        
//         // Educational Details
//         highest_qualification: req.body.highest_qualification !== undefined ? req.body.highest_qualification : employee.highest_qualification,
//         university: req.body.university !== undefined ? req.body.university : employee.university,
//         passing_year: req.body.passing_year !== undefined ? req.body.passing_year : employee.passing_year,
//         percentage: req.body.percentage !== undefined ? req.body.percentage : employee.percentage,
        
//         // Employment Details
//         employee_type: req.body.employee_type !== undefined ? req.body.employee_type : employee.employee_type,
//         probation_period: req.body.probation_period !== undefined ? req.body.probation_period : employee.probation_period,
//         work_mode: req.body.work_mode !== undefined ? req.body.work_mode : employee.work_mode,
//         date_of_leaving: req.body.date_of_leaving !== undefined ? req.body.date_of_leaving : employee.date_of_leaving,
//         notice_period: req.body.notice_period !== undefined ? req.body.notice_period : employee.notice_period,
//         salary: req.body.salary !== undefined ? req.body.salary : employee.salary,
//         salary_type: req.body.salary_type !== undefined ? req.body.salary_type : employee.salary_type,
        
//         // System Details
//         laptop_assigned: req.body.laptop_assigned !== undefined ? req.body.laptop_assigned : employee.laptop_assigned,
//         system_login_id: req.body.system_login_id !== undefined ? req.body.system_login_id : employee.system_login_id,
//         system_password: req.body.system_password !== undefined ? req.body.system_password : employee.system_password,
//         office_email_id: req.body.office_email_id !== undefined ? req.body.office_email_id : employee.office_email_id,
//         office_email_password: req.body.office_email_password !== undefined ? req.body.office_email_password : employee.office_email_password,
        
//         // Bank Details
//         bank_account_number: req.body.bank_account_number !== undefined ? req.body.bank_account_number : employee.bank_account_number,
//         bank_name: req.body.bank_name !== undefined ? req.body.bank_name : employee.bank_name,
//         ifsc_code: req.body.ifsc_code !== undefined ? req.body.ifsc_code : employee.ifsc_code,
//         upi_id: req.body.upi_id !== undefined ? req.body.upi_id : employee.upi_id,
        
//         // Status
//         employee_status: req.body.employee_status !== undefined ? req.body.employee_status : employee.employee_status
//       };

//       // Handle allotted_project separately
//       if (final_allotted_project !== undefined) {
//         updateData.allotted_project = final_allotted_project;
//       } else {
//         // Keep existing value as JSON string
//         if (employee.allotted_project && Array.isArray(employee.allotted_project)) {
//           updateData.allotted_project = JSON.stringify(employee.allotted_project);
//         } else if (employee.allotted_project === null || employee.allotted_project === undefined) {
//           updateData.allotted_project = JSON.stringify([]);
//         }
//       }

//       // Handle attendance_location separately
//       if (final_attendence_location !== undefined) {
//         updateData.attendence_location = final_attendence_location;
//       } else {
//         // Keep existing value as JSON string
//         if (employee.attendence_location && Array.isArray(employee.attendence_location)) {
//           updateData.attendence_location = JSON.stringify(employee.attendence_location);
//         } else if (employee.attendence_location === null || employee.attendence_location === undefined) {
//           updateData.attendence_location = JSON.stringify([]);
//         }
//       }

//       // Handle profile picture
//       if (req.file) {
//         // Delete old profile picture if exists
//         if (employee.profile_picture) {
//           const oldPath = path.join(__dirname, '..', employee.profile_picture);
//           if (fs.existsSync(oldPath)) {
//             fs.unlinkSync(oldPath);
//           }
//         }
//         updateData.profile_picture = `/uploads/${req.file.filename}`;
//       }

//       console.log("Updating employee with data:", updateData);

//       const updated = await HrmsEmployee.update(id, updateData);
//       res.json(updated);
//     });
//   } catch (error) {
//     console.error("Update employee error:", error);
//     console.error("Error stack:", error.stack);
    
//     // Clean up uploaded file if error occurred
//     if (req.file && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }
    
//     res.status(500).json({ 
//       message: "Failed to update employee",
//       error: error.message 
//     });
//   }
// };

// /**
//  * Update only additional details (for AddMoreDetailsModal)
//  */
// exports.updateAdditionalDetails = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const employee = await HrmsEmployee.findById(id);
    
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     // Only update additional fields, not basic info
//     const updateData = {
//       // Personal Details
//       blood_group: req.body.blood_group !== undefined ? req.body.blood_group : employee.blood_group,
//       date_of_birth: req.body.date_of_birth !== undefined ? req.body.date_of_birth : employee.date_of_birth,
//       marital_status: req.body.marital_status !== undefined ? req.body.marital_status : employee.marital_status,
//       emergency_contact: req.body.emergency_contact !== undefined ? req.body.emergency_contact : employee.emergency_contact,
//       emergency_contact_relationship: req.body.emergency_contact_relationship !== undefined ? req.body.emergency_contact_relationship : employee.emergency_contact_relationship,
//       emergency_contact_name: req.body.emergency_contact_name !== undefined ? req.body.emergency_contact_name : employee.emergency_contact_name,
//       nationality: req.body.nationality !== undefined ? req.body.nationality : employee.nationality,
      
//       // Address Details
//       current_address: req.body.current_address !== undefined ? req.body.current_address : employee.current_address,
//       permanent_address: req.body.permanent_address !== undefined ? req.body.permanent_address : employee.permanent_address,
//       city: req.body.city !== undefined ? req.body.city : employee.city,
//       state: req.body.state !== undefined ? req.body.state : employee.state,
//       pincode: req.body.pincode !== undefined ? req.body.pincode : employee.pincode,
//       same_as_permanent: req.body.same_as_permanent !== undefined 
//         ? (req.body.same_as_permanent === 'true' || req.body.same_as_permanent === true)
//         : employee.same_as_permanent,
      
//       // Identification
//       aadhar_number: req.body.aadhar_number !== undefined ? req.body.aadhar_number : employee.aadhar_number,
//       pan_number: req.body.pan_number !== undefined ? req.body.pan_number : employee.pan_number,
      
//       // Educational Details
//       highest_qualification: req.body.highest_qualification !== undefined ? req.body.highest_qualification : employee.highest_qualification,
//       university: req.body.university !== undefined ? req.body.university : employee.university,
//       passing_year: req.body.passing_year !== undefined ? req.body.passing_year : employee.passing_year,
//       percentage: req.body.percentage !== undefined ? req.body.percentage : employee.percentage,
      
//       // Employment Details
//       employee_type: req.body.employee_type !== undefined ? req.body.employee_type : employee.employee_type,
//       probation_period: req.body.probation_period !== undefined ? req.body.probation_period : employee.probation_period,
//       work_mode: req.body.work_mode !== undefined ? req.body.work_mode : employee.work_mode,
//       date_of_leaving: req.body.date_of_leaving !== undefined ? req.body.date_of_leaving : employee.date_of_leaving,
//       notice_period: req.body.notice_period !== undefined ? req.body.notice_period : employee.notice_period,
//       salary: req.body.salary !== undefined ? req.body.salary : employee.salary,
//       salary_type: req.body.salary_type !== undefined ? req.body.salary_type : employee.salary_type,
      
//       // System Details
//       laptop_assigned: req.body.laptop_assigned !== undefined ? req.body.laptop_assigned : employee.laptop_assigned,
//       system_login_id: req.body.system_login_id !== undefined ? req.body.system_login_id : employee.system_login_id,
//       system_password: req.body.system_password !== undefined ? req.body.system_password : employee.system_password,
//       office_email_id: req.body.office_email_id !== undefined ? req.body.office_email_id : employee.office_email_id,
//       office_email_password: req.body.office_email_password !== undefined ? req.body.office_email_password : employee.office_email_password,
      
//       // Bank Details
//       bank_account_number: req.body.bank_account_number !== undefined ? req.body.bank_account_number : employee.bank_account_number,
//       bank_name: req.body.bank_name !== undefined ? req.body.bank_name : employee.bank_name,
//       ifsc_code: req.body.ifsc_code !== undefined ? req.body.ifsc_code : employee.ifsc_code,
//       upi_id: req.body.upi_id !== undefined ? req.body.upi_id : employee.upi_id,
//     };

//     console.log("Updating additional details:", updateData);

//     const updated = await HrmsEmployee.update(id, updateData);
//     res.json({
//       success: true,
//       message: "Additional details updated successfully",
//       data: updated
//     });
//   } catch (error) {
//     console.error("Update additional details error:", error);
//     res.status(500).json({ 
//       success: false,
//       message: "Failed to update additional details",
//       error: error.message 
//     });
//   }
// };

// /**
//  * Create employee from user (simplified)
//  */
// exports.createEmployeeFromUser = async (req, res) => {
//   try {
//     let {
//       first_name,
//       last_name,
//       email,
//       phone,
//       role_id,
//       department_id,
//       designation,
//       joining_date,
//       gender,
//       allotted_project,
//       office_location,
//       attendence_location,
//       company_id,
//       profile_picture = null
//     } = req.body;

//     console.log("Received employee data:", req.body);

//     // If last_name is empty, use first_name
//     if (!last_name || last_name.trim() === '') {
//       last_name = first_name;
//     }

//     // Handle allotted_project as JSON array
//     let final_allotted_project = null;
//     if (allotted_project) {
//       if (typeof allotted_project === 'string') {
//         try {
//           const parsed = JSON.parse(allotted_project);
//           if (Array.isArray(parsed) && parsed.length > 0) {
//             final_allotted_project = JSON.stringify(parsed.map(id => parseInt(id)).filter(Boolean));
//           }
//         } catch {
//           if (allotted_project.includes(',')) {
//             const projects = allotted_project.split(',').map(id => parseInt(id.trim())).filter(Boolean);
//             if (projects.length > 0) {
//               final_allotted_project = JSON.stringify(projects);
//             }
//           } else {
//             const num = parseInt(allotted_project);
//             if (!isNaN(num)) {
//               final_allotted_project = JSON.stringify([num]);
//             }
//           }
//         }
//       } else if (Array.isArray(allotted_project) && allotted_project.length > 0) {
//         final_allotted_project = JSON.stringify(allotted_project.map(id => parseInt(id)).filter(Boolean));
//       }
//     }

//     // Handle attendance_location as JSON array
//     let final_attendence_location = attendence_location || '';
//     if (attendence_location) {
//        if (typeof attendence_location === 'string' && attendence_location.startsWith('[')) {
//       try {
//         const parsed = JSON.parse(attendence_location);
//         if (Array.isArray(parsed) && parsed.length > 0) {
//           final_attendence_location = JSON.stringify(parsed);
//         }
//         } catch {
//           if (attendence_location.includes(',')) {
//             const locations = attendence_location.split(',').map(loc => loc.trim()).filter(Boolean);
//             if (locations.length > 0) {
//               final_attendence_location = JSON.stringify(locations);
//             }
//           } else if (attendence_location.trim() !== '') {
//             final_attendence_location = JSON.stringify([attendence_location.trim()]);
//           }
//         }
//       } else if (Array.isArray(attendence_location) && attendence_location.length > 0) {
//         final_attendence_location = JSON.stringify(attendence_location);
//       }
//     }

//     // Basic validation
//     const requiredFields = {
//       'first_name': first_name,
//       'email': email,
//       'phone': phone,
//       'designation': designation,
//       'joining_date': joining_date,
//       'gender': gender,
//             'attendence_location': attendence_location  // ✅ Add validation

//     };

//     const missingFields = Object.entries(requiredFields)
//       .filter(([key, value]) => !value)
//       .map(([key]) => key);

//     if (missingFields.length > 0) {
//       console.error("Missing fields:", missingFields);
//       return res.status(400).json({
//         success: false,
//         message: `Missing required fields: ${missingFields.join(', ')}`,
//       });
//     }

//     // Check for duplicate email
//     const existing = await HrmsEmployee.findByEmail(email);
//     if (existing) {
//       console.log("Duplicate email found:", email);
//       return res.status(409).json({
//         success: false,
//         message: "Employee with this email already exists",
//       });
//     }

//     // Prepare employee data
//     const employeeData = {
//       first_name,
//       last_name,
//       email,
//       phone,
//       role_id: role_id || null,
//       department_id: department_id || null,
//       designation,
//       joining_date,
//       gender,
//       allotted_project: final_allotted_project,
//       office_location: office_location || null,
//       attendence_location: final_attendence_location,
//       company_id: company_id || null,
//       profile_picture: profile_picture || null,
//       employee_status: 'active',
//       salary: req.body.salary || null,
//       salary_type: req.body.salary_type || 'monthly',
//     };

//     console.log("Creating employee from user with data:", employeeData);

//     const employee = await HrmsEmployee.create(employeeData);
    
//     // Generate employee code
//     const employeeCode = `EMP${String(employee.id).padStart(4, '0')}`;
//     await HrmsEmployee.update(employee.id, { employee_code: employeeCode });
    
//     employee.employee_code = employeeCode;
    
//     console.log("Employee created successfully:", employee);
    
//     res.status(201).json({
//       success: true,
//       data: employee,
//       message: "Employee created successfully"
//     });
//   } catch (error) {
//     console.error("Create employee from user FULL ERROR:", error);
//     console.error("Error stack:", error.stack);
//     res.status(500).json({ 
//       success: false,
//       message: "Failed to create employee",
//       error: error.message
//     });
//   }
// };

// /**
//  * Delete employee
//  */
// exports.deleteEmployee = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const employee = await HrmsEmployee.findById(id);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     // Delete profile picture if exists
//     if (employee.profile_picture) {
//       const filePath = path.join(__dirname, '..', employee.profile_picture);
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     }

//     await HrmsEmployee.remove(id);
//     res.json({ success: true, message: "Employee deleted successfully" });
//   } catch (error) {
//     console.error("Delete employee error:", error);
//     res.status(500).json({ message: "Failed to delete employee" });
//   }
// };


/*------------31-1-2026-----------------------*/



const upload = require("../middleware/upload");
const HrmsEmployee = require("../models/employees.model");
const fs = require("fs");
const path = require("path");

/**
 * Get all employees
 */
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await HrmsEmployee.findAll();
    console.log("Fetched employees from DB:", employees.length);
    
    if (Array.isArray(employees)) {
      res.json(employees);
    } else {
      console.error("Employees is not an array:", employees);
      res.json([]);
    }
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
};

/**
 * Get employee by ID
 */
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await HrmsEmployee.findById(id);
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    console.error("Get employee by ID error:", error);
    res.status(500).json({ message: "Failed to fetch employee" });
  }
};

/**
 * Get employee by email
 */
exports.getEmployeeByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const employee = await HrmsEmployee.findByEmail(email);
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    console.error("Get employee by email error:", error);
    res.status(500).json({ message: "Failed to fetch employee" });
  }
};

/**
 * Create employee with comprehensive data
 */
exports.createEmployee = async (req, res) => {
  try {
    upload.single('profile_picture')(req, res, async function(err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      console.log("Received employee data:", req.body);
      console.log("Files:", req.file);

      // Handle allotted_project as JSON array
      let final_allotted_project = null;
      if (req.body.allotted_project) {
        if (typeof req.body.allotted_project === 'string') {
          try {
            const parsed = JSON.parse(req.body.allotted_project);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Validate project IDs exist before saving
              final_allotted_project = JSON.stringify(parsed.map(id => parseInt(id)).filter(Boolean));
            }
          } catch {
            // If it's a comma-separated string, convert to array
            if (req.body.allotted_project.includes(',')) {
              const projects = req.body.allotted_project.split(',').map(id => parseInt(id.trim())).filter(Boolean);
              if (projects.length > 0) {
                final_allotted_project = JSON.stringify(projects);
              }
            } else {
              // Single value
              const num = parseInt(req.body.allotted_project);
              if (!isNaN(num)) {
                final_allotted_project = JSON.stringify([num]);
              }
            }
          }
        } else if (Array.isArray(req.body.allotted_project) && req.body.allotted_project.length > 0) {
          // Already an array from frontend
          final_allotted_project = JSON.stringify(req.body.allotted_project.map(id => parseInt(id)).filter(Boolean));
        }
      }

      // Handle attendance_location array
      let final_attendence_location = null;
      if (req.body.attendence_location) {
        if (typeof req.body.attendence_location === 'string') {
          try {
            const parsed = JSON.parse(req.body.attendence_location);
            if (Array.isArray(parsed) && parsed.length > 0) {
              final_attendence_location = JSON.stringify(parsed);
            }
          } catch {
            // If it's a comma-separated string, split it
            if (req.body.attendence_location.includes(',')) {
              const locations = req.body.attendence_location.split(',').map(loc => loc.trim()).filter(Boolean);
              if (locations.length > 0) {
                final_attendence_location = JSON.stringify(locations);
              }
            } else if (req.body.attendence_location.trim() !== '') {
              final_attendence_location = JSON.stringify([req.body.attendence_location.trim()]);
            }
          }
        } else if (Array.isArray(req.body.attendence_location) && req.body.attendence_location.length > 0) {
          final_attendence_location = JSON.stringify(req.body.attendence_location);
        }
      }

      // Basic required fields validation
      const requiredFields = [
        'first_name',
        'last_name', 
        'email',
        'phone',
        'role_id',
        'department_id',
        'designation',
        'joining_date',
        'gender'
      ];

      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        });
      }

      // Prevent duplicate email
      const existing = await HrmsEmployee.findByEmail(req.body.email);
      if (existing) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(409).json({
          message: "Employee with this email already exists",
        });
      }

      // Prepare comprehensive employee data
      const employeeData = {
        // Basic Details
        first_name: req.body.first_name,
        middle_name: req.body.middle_name || null,
        last_name: req.body.last_name,
        email: req.body.email,
        phone: req.body.phone,
        role_id: req.body.role_id,
        department_id: req.body.department_id,
        designation: req.body.designation,
        joining_date: req.body.joining_date,
        gender: req.body.gender,
        allotted_project: final_allotted_project,
        attendence_location: final_attendence_location,
        company_id: req.body.company_id || null,
        profile_picture: req.file ? `/uploads/${req.file.filename}` : null,
        
        // Personal Details
        blood_group: req.body.blood_group || null,
        date_of_birth: req.body.date_of_birth || null,
        marital_status: req.body.marital_status || null,
        emergency_contact: req.body.emergency_contact || null,
        emergency_contact_relationship: req.body.emergency_contact_relationship || null,
        emergency_contact_name: req.body.emergency_contact_name || null,
        nationality: req.body.nationality || 'Indian',
        
        // Address Details
        current_address: req.body.current_address || null,
        permanent_address: req.body.permanent_address || null,
        city: req.body.city || null,
        state: req.body.state || null,
        pincode: req.body.pincode || null,
        same_as_permanent: req.body.same_as_permanent === 'true' || req.body.same_as_permanent === true,
        
        // Identification
        aadhar_number: req.body.aadhar_number || null,
        pan_number: req.body.pan_number || null,
        
        // Educational Details
        highest_qualification: req.body.highest_qualification || null,
        university: req.body.university || null,
        passing_year: req.body.passing_year || null,
        percentage: req.body.percentage || null,
        
        // Employment Details
        employee_type: req.body.employee_type || 'permanent',
        probation_period: req.body.probation_period || null,
        work_mode: req.body.work_mode || 'office',
        date_of_leaving: req.body.date_of_leaving || null,
        notice_period: req.body.notice_period || '30',
        salary: req.body.salary || null,
        salary_type: req.body.salary_type || 'monthly',

        // System Details
        laptop_assigned: req.body.laptop_assigned || 'no',
        system_login_id: req.body.system_login_id || null,
        system_password: req.body.system_password || null,
        office_email_id: req.body.office_email_id || null,
        office_email_password: req.body.office_email_password || null,
        
        // Bank Details
        bank_account_number: req.body.bank_account_number || null,
        bank_name: req.body.bank_name || null,
        ifsc_code: req.body.ifsc_code || null,
        upi_id: req.body.upi_id || null,
        
        // Status (default to active)
        employee_status: req.body.employee_status || 'active'
      };

      console.log("Creating employee with data:", employeeData);

      const employee = await HrmsEmployee.create(employeeData);
      
      // Generate employee code after creation
      const employeeCode = `EMP${String(employee.id).padStart(4, '0')}`;
      await HrmsEmployee.update(employee.id, { employee_code: employeeCode });
      
      employee.employee_code = employeeCode;
      
      res.status(201).json(employee);
    });
  } catch (error) {
    console.error("Create employee error:", error);
    console.error("Error stack:", error.stack);
    
    // Clean up uploaded file if error occurred
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: "Failed to create employee",
      error: error.message 
    });
  }
};

/**
 * Update employee with comprehensive data - SYNC TO USER
 */
exports.updateEmployee = async (req, res) => {
  try {
    upload.single('profile_picture')(req, res, async function(err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { id } = req.params;
      const employee = await HrmsEmployee.findById(id);
      
      if (!employee) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: "Employee not found" });
      }

      // Handle allotted_project as JSON array
      let final_allotted_project = undefined;
      if (req.body.allotted_project !== undefined) {
        if (typeof req.body.allotted_project === 'string') {
          try {
            const parsed = JSON.parse(req.body.allotted_project);
            if (Array.isArray(parsed)) {
              // Store as JSON array (empty array if no projects)
              final_allotted_project = parsed.length > 0 
                ? JSON.stringify(parsed.map(id => parseInt(id)).filter(Boolean))
                : JSON.stringify([]);
            }
          } catch {
            // If it's a comma-separated string, convert to array
            if (req.body.allotted_project.includes(',')) {
              const projects = req.body.allotted_project.split(',').map(id => parseInt(id.trim())).filter(Boolean);
              final_allotted_project = JSON.stringify(projects);
            } else if (req.body.allotted_project.trim() === '') {
              // Empty string means no projects
              final_allotted_project = JSON.stringify([]);
            } else {
              // Single value
              const num = parseInt(req.body.allotted_project);
              final_allotted_project = !isNaN(num) ? JSON.stringify([num]) : JSON.stringify([]);
            }
          }
        } else if (Array.isArray(req.body.allotted_project)) {
          // Already an array from frontend
          final_allotted_project = JSON.stringify(req.body.allotted_project.map(id => parseInt(id)).filter(Boolean));
        } else if (req.body.allotted_project === null || req.body.allotted_project === '') {
          // Null or empty means no projects
          final_allotted_project = JSON.stringify([]);
        }
      }

      // Handle attendance_location array
      let final_attendence_location = undefined;
      if (req.body.attendence_location !== undefined) {
        if (typeof req.body.attendence_location === 'string') {
          try {
            const parsed = JSON.parse(req.body.attendence_location);
            if (Array.isArray(parsed)) {
              final_attendence_location = parsed.length > 0 
                ? JSON.stringify(parsed)
                : JSON.stringify([]);
            }
          } catch {
            // If it's a comma-separated string, split it
            if (req.body.attendence_location.includes(',')) {
              const locations = req.body.attendence_location.split(',').map(loc => loc.trim()).filter(Boolean);
              final_attendence_location = JSON.stringify(locations);
            } else if (req.body.attendence_location.trim() === '') {
              final_attendence_location = JSON.stringify([]);
            } else {
              final_attendence_location = JSON.stringify([req.body.attendence_location.trim()]);
            }
          }
        } else if (Array.isArray(req.body.attendence_location)) {
          final_attendence_location = JSON.stringify(req.body.attendence_location);
        } else if (req.body.attendence_location === null || req.body.attendence_location === '') {
          final_attendence_location = JSON.stringify([]);
        }
      }

      // If email is being updated, check uniqueness
      if (req.body.email && req.body.email !== employee.email) {
        const existing = await HrmsEmployee.findByEmail(req.body.email);
        if (existing) {
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(409).json({
            message: "Email already in use by another employee",
          });
        }
      }

      // Prepare update data - ALWAYS use existing values as fallback
      const updateData = {
        // Basic Details
        first_name: req.body.first_name !== undefined ? req.body.first_name : employee.first_name,
        middle_name: req.body.middle_name !== undefined ? req.body.middle_name : employee.middle_name,
        last_name: req.body.last_name !== undefined ? req.body.last_name : employee.last_name,
        email: req.body.email !== undefined ? req.body.email : employee.email,
        phone: req.body.phone !== undefined ? req.body.phone : employee.phone,
        role_id: req.body.role_id !== undefined ? req.body.role_id : employee.role_id,
        department_id: req.body.department_id !== undefined ? req.body.department_id : employee.department_id,
        designation: req.body.designation !== undefined ? req.body.designation : employee.designation,
        joining_date: req.body.joining_date !== undefined ? req.body.joining_date : employee.joining_date,
        gender: req.body.gender !== undefined ? req.body.gender : employee.gender,
        company_id: req.body.company_id !== undefined ? req.body.company_id : employee.company_id,
        
        // Personal Details
        blood_group: req.body.blood_group !== undefined ? req.body.blood_group : employee.blood_group,
        date_of_birth: req.body.date_of_birth !== undefined ? req.body.date_of_birth : employee.date_of_birth,
        marital_status: req.body.marital_status !== undefined ? req.body.marital_status : employee.marital_status,
        emergency_contact: req.body.emergency_contact !== undefined ? req.body.emergency_contact : employee.emergency_contact,
        emergency_contact_relationship: req.body.emergency_contact_relationship !== undefined ? req.body.emergency_contact_relationship : employee.emergency_contact_relationship,
        emergency_contact_name: req.body.emergency_contact_name !== undefined ? req.body.emergency_contact_name : employee.emergency_contact_name,
        nationality: req.body.nationality !== undefined ? req.body.nationality : employee.nationality,
        
        // Address Details
        current_address: req.body.current_address !== undefined ? req.body.current_address : employee.current_address,
        permanent_address: req.body.permanent_address !== undefined ? req.body.permanent_address : employee.permanent_address,
        city: req.body.city !== undefined ? req.body.city : employee.city,
        state: req.body.state !== undefined ? req.body.state : employee.state,
        pincode: req.body.pincode !== undefined ? req.body.pincode : employee.pincode,
        same_as_permanent: req.body.same_as_permanent !== undefined 
          ? (req.body.same_as_permanent === 'true' || req.body.same_as_permanent === true)
          : employee.same_as_permanent,
        
        // Identification
        aadhar_number: req.body.aadhar_number !== undefined ? req.body.aadhar_number : employee.aadhar_number,
        pan_number: req.body.pan_number !== undefined ? req.body.pan_number : employee.pan_number,
        
        // Educational Details
        highest_qualification: req.body.highest_qualification !== undefined ? req.body.highest_qualification : employee.highest_qualification,
        university: req.body.university !== undefined ? req.body.university : employee.university,
        passing_year: req.body.passing_year !== undefined ? req.body.passing_year : employee.passing_year,
        percentage: req.body.percentage !== undefined ? req.body.percentage : employee.percentage,
        
        // Employment Details
        employee_type: req.body.employee_type !== undefined ? req.body.employee_type : employee.employee_type,
        probation_period: req.body.probation_period !== undefined ? req.body.probation_period : employee.probation_period,
        work_mode: req.body.work_mode !== undefined ? req.body.work_mode : employee.work_mode,
        date_of_leaving: req.body.date_of_leaving !== undefined ? req.body.date_of_leaving : employee.date_of_leaving,
        notice_period: req.body.notice_period !== undefined ? req.body.notice_period : employee.notice_period,
        salary: req.body.salary !== undefined ? req.body.salary : employee.salary,
        salary_type: req.body.salary_type !== undefined ? req.body.salary_type : employee.salary_type,
        
        // System Details
        laptop_assigned: req.body.laptop_assigned !== undefined ? req.body.laptop_assigned : employee.laptop_assigned,
        system_login_id: req.body.system_login_id !== undefined ? req.body.system_login_id : employee.system_login_id,
        system_password: req.body.system_password !== undefined ? req.body.system_password : employee.system_password,
        office_email_id: req.body.office_email_id !== undefined ? req.body.office_email_id : employee.office_email_id,
        office_email_password: req.body.office_email_password !== undefined ? req.body.office_email_password : employee.office_email_password,
        
        // Bank Details
        bank_account_number: req.body.bank_account_number !== undefined ? req.body.bank_account_number : employee.bank_account_number,
        bank_name: req.body.bank_name !== undefined ? req.body.bank_name : employee.bank_name,
        ifsc_code: req.body.ifsc_code !== undefined ? req.body.ifsc_code : employee.ifsc_code,
        upi_id: req.body.upi_id !== undefined ? req.body.upi_id : employee.upi_id,
        
        // Status
        employee_status: req.body.employee_status !== undefined ? req.body.employee_status : employee.employee_status
      };

      // Handle allotted_project separately
      if (final_allotted_project !== undefined) {
        updateData.allotted_project = final_allotted_project;
      } else {
        // Keep existing value as JSON string
        if (employee.allotted_project && Array.isArray(employee.allotted_project)) {
          updateData.allotted_project = JSON.stringify(employee.allotted_project);
        } else if (employee.allotted_project === null || employee.allotted_project === undefined) {
          updateData.allotted_project = JSON.stringify([]);
        }
      }

      // Handle attendance_location separately
      if (final_attendence_location !== undefined) {
        updateData.attendence_location = final_attendence_location;
      } else {
        // Keep existing value as JSON string
        if (employee.attendence_location && Array.isArray(employee.attendence_location)) {
          updateData.attendence_location = JSON.stringify(employee.attendence_location);
        } else if (employee.attendence_location === null || employee.attendence_location === undefined) {
          updateData.attendence_location = JSON.stringify([]);
        }
      }

      // Handle profile picture
      if (req.file) {
        // Delete old profile picture if exists
        if (employee.profile_picture) {
          const oldPath = path.join(__dirname, '..', employee.profile_picture);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        updateData.profile_picture = `/uploads/${req.file.filename}`;
      }

      console.log("Updating employee with data:", updateData);

      const updated = await HrmsEmployee.update(id, updateData);

      // ✅ SYNC TO USER TABLE
      try {
        const { query } = require("../config/db");
        
        // Check if user exists for this employee (using OLD email before update)
        const userRows = await query(
          `SELECT id FROM users WHERE email = ? LIMIT 1`,
          [employee.email]
        );
        
        if (userRows && userRows.length > 0) {
          const userId = userRows[0].id;
          
          // Prepare user update data
          const userUpdateData = {};
          
          // Build full name
          if (req.body.first_name !== undefined || req.body.middle_name !== undefined || req.body.last_name !== undefined) {
            const firstName = req.body.first_name !== undefined ? req.body.first_name : employee.first_name;
            const middleName = req.body.middle_name !== undefined ? req.body.middle_name : employee.middle_name;
            const lastName = req.body.last_name !== undefined ? req.body.last_name : employee.last_name;
            
            userUpdateData.full_name = [firstName, middleName, lastName]
              .filter(name => name && name.trim())
              .join(' ');
          }
          
          if (req.body.phone !== undefined) userUpdateData.phone = req.body.phone;
          if (req.file) userUpdateData.profile_picture = `/uploads/${req.file.filename}`;
          if (req.body.employee_status !== undefined) {
            userUpdateData.is_active = req.body.employee_status === 'active' ? 1 : 0;
          }
          
          // Update email if changed
          if (req.body.email !== undefined && req.body.email !== employee.email) {
            userUpdateData.email = req.body.email;
          }
        if (req.body.role_id !== undefined) {
      const roleRows = await query(
        `SELECT name FROM roles WHERE id = ? LIMIT 1`,
        [req.body.role_id]
      );
      if (roleRows && roleRows.length > 0) {
        userUpdateData.role = roleRows[0].name.toUpperCase();
      }
    }

     if (req.body.department_id !== undefined) {
      const deptRows = await query(
        `SELECT name FROM departments WHERE id = ? LIMIT 1`,
        [req.body.department_id]
      );
      if (deptRows && deptRows.length > 0) {
        userUpdateData.department = deptRows[0].name;
        userUpdateData.department_id = req.body.department_id;
      }
    }
          // Build dynamic update query
          const fields = [];
          const values = [];
          
          Object.entries(userUpdateData).forEach(([key, value]) => {
            fields.push(`${key} = ?`);
            values.push(value);
          });
          
          if (fields.length > 0) {
            fields.push('updated_at = NOW()');
            values.push(userId);
            await query(
              `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
              values
            );
            console.log(`User ${userId} synced successfully`);
          }
        }
      } catch (syncError) {
        console.warn("Could not sync to user:", syncError.message);
        // Continue even if sync fails
      }

      res.json(updated);
    });
  } catch (error) {
    console.error("Update employee error:", error);
    console.error("Error stack:", error.stack);
    
    // Clean up uploaded file if error occurred
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: "Failed to update employee",
      error: error.message 
    });
  }
};

/**
 * Update only additional details (for AddMoreDetailsModal)
 */
exports.updateAdditionalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await HrmsEmployee.findById(id);
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Only update additional fields, not basic info
    const updateData = {
      // Personal Details
      blood_group: req.body.blood_group !== undefined ? req.body.blood_group : employee.blood_group,
      date_of_birth: req.body.date_of_birth !== undefined ? req.body.date_of_birth : employee.date_of_birth,
      marital_status: req.body.marital_status !== undefined ? req.body.marital_status : employee.marital_status,
      emergency_contact: req.body.emergency_contact !== undefined ? req.body.emergency_contact : employee.emergency_contact,
      emergency_contact_relationship: req.body.emergency_contact_relationship !== undefined ? req.body.emergency_contact_relationship : employee.emergency_contact_relationship,
      emergency_contact_name: req.body.emergency_contact_name !== undefined ? req.body.emergency_contact_name : employee.emergency_contact_name,
      nationality: req.body.nationality !== undefined ? req.body.nationality : employee.nationality,
      
      // Address Details
      current_address: req.body.current_address !== undefined ? req.body.current_address : employee.current_address,
      permanent_address: req.body.permanent_address !== undefined ? req.body.permanent_address : employee.permanent_address,
      city: req.body.city !== undefined ? req.body.city : employee.city,
      state: req.body.state !== undefined ? req.body.state : employee.state,
      pincode: req.body.pincode !== undefined ? req.body.pincode : employee.pincode,
      same_as_permanent: req.body.same_as_permanent !== undefined 
        ? (req.body.same_as_permanent === 'true' || req.body.same_as_permanent === true)
        : employee.same_as_permanent,
      
      // Identification
      aadhar_number: req.body.aadhar_number !== undefined ? req.body.aadhar_number : employee.aadhar_number,
      pan_number: req.body.pan_number !== undefined ? req.body.pan_number : employee.pan_number,
      
      // Educational Details
      highest_qualification: req.body.highest_qualification !== undefined ? req.body.highest_qualification : employee.highest_qualification,
      university: req.body.university !== undefined ? req.body.university : employee.university,
      passing_year: req.body.passing_year !== undefined ? req.body.passing_year : employee.passing_year,
      percentage: req.body.percentage !== undefined ? req.body.percentage : employee.percentage,
      
      // Employment Details
      employee_type: req.body.employee_type !== undefined ? req.body.employee_type : employee.employee_type,
      probation_period: req.body.probation_period !== undefined ? req.body.probation_period : employee.probation_period,
      work_mode: req.body.work_mode !== undefined ? req.body.work_mode : employee.work_mode,
      date_of_leaving: req.body.date_of_leaving !== undefined ? req.body.date_of_leaving : employee.date_of_leaving,
      notice_period: req.body.notice_period !== undefined ? req.body.notice_period : employee.notice_period,
      salary: req.body.salary !== undefined ? req.body.salary : employee.salary,
      salary_type: req.body.salary_type !== undefined ? req.body.salary_type : employee.salary_type,
      
      // System Details
      laptop_assigned: req.body.laptop_assigned !== undefined ? req.body.laptop_assigned : employee.laptop_assigned,
      system_login_id: req.body.system_login_id !== undefined ? req.body.system_login_id : employee.system_login_id,
      system_password: req.body.system_password !== undefined ? req.body.system_password : employee.system_password,
      office_email_id: req.body.office_email_id !== undefined ? req.body.office_email_id : employee.office_email_id,
      office_email_password: req.body.office_email_password !== undefined ? req.body.office_email_password : employee.office_email_password,
      
      // Bank Details
      bank_account_number: req.body.bank_account_number !== undefined ? req.body.bank_account_number : employee.bank_account_number,
      bank_name: req.body.bank_name !== undefined ? req.body.bank_name : employee.bank_name,
      ifsc_code: req.body.ifsc_code !== undefined ? req.body.ifsc_code : employee.ifsc_code,
      upi_id: req.body.upi_id !== undefined ? req.body.upi_id : employee.upi_id,
    };

    console.log("Updating additional details:", updateData);

    const updated = await HrmsEmployee.update(id, updateData);
    res.json({
      success: true,
      message: "Additional details updated successfully",
      data: updated
    });
  } catch (error) {
    console.error("Update additional details error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update additional details",
      error: error.message 
    });
  }
};

/**
 * Create employee from user (simplified)
 */
exports.createEmployeeFromUser = async (req, res) => {
  try {
    let {
      first_name,
      last_name,
      email,
      phone,
      role_id,
      department_id,
      designation,
      joining_date,
      gender,
      allotted_project,
      office_location,
      attendence_location,
      company_id,
      profile_picture = null
    } = req.body;

    console.log("Received employee data:", req.body);

    // If last_name is empty, use first_name
    if (!last_name || last_name.trim() === '') {
      last_name = first_name;
    }

    // Handle allotted_project as JSON array
    let final_allotted_project = null;
    if (allotted_project) {
      if (typeof allotted_project === 'string') {
        try {
          const parsed = JSON.parse(allotted_project);
          if (Array.isArray(parsed) && parsed.length > 0) {
            final_allotted_project = JSON.stringify(parsed.map(id => parseInt(id)).filter(Boolean));
          }
        } catch {
          if (allotted_project.includes(',')) {
            const projects = allotted_project.split(',').map(id => parseInt(id.trim())).filter(Boolean);
            if (projects.length > 0) {
              final_allotted_project = JSON.stringify(projects);
            }
          } else {
            const num = parseInt(allotted_project);
            if (!isNaN(num)) {
              final_allotted_project = JSON.stringify([num]);
            }
          }
        }
      } else if (Array.isArray(allotted_project) && allotted_project.length > 0) {
        final_allotted_project = JSON.stringify(allotted_project.map(id => parseInt(id)).filter(Boolean));
      }
    }

    // Handle attendance_location as JSON array
    let final_attendence_location = attendence_location || '';
    if (attendence_location) {
       if (typeof attendence_location === 'string' && attendence_location.startsWith('[')) {
      try {
        const parsed = JSON.parse(attendence_location);
        if (Array.isArray(parsed) && parsed.length > 0) {
          final_attendence_location = JSON.stringify(parsed);
        }
        } catch {
          if (attendence_location.includes(',')) {
            const locations = attendence_location.split(',').map(loc => loc.trim()).filter(Boolean);
            if (locations.length > 0) {
              final_attendence_location = JSON.stringify(locations);
            }
          } else if (attendence_location.trim() !== '') {
            final_attendence_location = JSON.stringify([attendence_location.trim()]);
          }
        }
      } else if (Array.isArray(attendence_location) && attendence_location.length > 0) {
        final_attendence_location = JSON.stringify(attendence_location);
      }
    }

    // Basic validation
    const requiredFields = {
      'first_name': first_name,
      'email': email,
      'phone': phone,
      'designation': designation,
      'joining_date': joining_date,
      'gender': gender,
      'attendence_location': attendence_location
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.error("Missing fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Check for duplicate email
    const existing = await HrmsEmployee.findByEmail(email);
    if (existing) {
      console.log("Duplicate email found:", email);
      return res.status(409).json({
        success: false,
        message: "Employee with this email already exists",
      });
    }

    // Prepare employee data
    const employeeData = {
      first_name,
      last_name,
      email,
      phone,
      role_id: role_id || null,
      department_id: department_id || null,
      designation,
      joining_date,
      gender,
      allotted_project: final_allotted_project,
      office_location: office_location || null,
      attendence_location: final_attendence_location,
      company_id: company_id || null,
      profile_picture: profile_picture || null,
      employee_status: 'active',
      salary: req.body.salary || null,
      salary_type: req.body.salary_type || 'monthly',
    };

    console.log("Creating employee from user with data:", employeeData);

    const employee = await HrmsEmployee.create(employeeData);
    
    // Generate employee code
    const employeeCode = `EMP${String(employee.id).padStart(4, '0')}`;
    await HrmsEmployee.update(employee.id, { employee_code: employeeCode });
    
    employee.employee_code = employeeCode;
    
    console.log("Employee created successfully:", employee);
    
    res.status(201).json({
      success: true,
      data: employee,
      message: "Employee created successfully"
    });
  } catch (error) {
    console.error("Create employee from user FULL ERROR:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      success: false,
      message: "Failed to create employee",
      error: error.message
    });
  }
};

/**
 * Delete employee - ALSO DELETE USER
 */
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await HrmsEmployee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Delete profile picture if exists
    if (employee.profile_picture) {
      const filePath = path.join(__dirname, '..', employee.profile_picture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // ✅ DELETE USER RECORD IF EXISTS
    try {
      const { query } = require("../config/db");
      await query(
        `DELETE FROM users WHERE email = ?`,
        [employee.email]
      );
      console.log(`User record deleted for employee: ${employee.email}`);
    } catch (userError) {
      console.warn("Could not delete user record:", userError.message);
      // Continue with employee deletion even if user deletion fails
    }

    // Delete employee
    await HrmsEmployee.remove(id);
    
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ message: "Failed to delete employee" });
  }
};