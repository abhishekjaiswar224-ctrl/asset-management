import pool from '../db.js';

export async function createEmp(req, res) {
    const { employee_name, emp_id, location, employee_role, assets } = req.body;
    
    console.log("createEmp called with:", JSON.stringify({
        employee_name, 
        emp_id, 
        location, 
        employee_role, 
        assets_count: assets?.length || 0,
        user_id: req.user?.userId,
        user_role: req.user?.role
    }, null, 2));
    
    // First check if this emp_id already exists in the employees table
    try {
        const [existingEmployee] = await pool.query(
            "SELECT * FROM employees WHERE emp_id = ?",
            [emp_id]
        );
        
        console.log("Check for existing emp_id in employees table:", existingEmployee.length > 0);
        
        if (existingEmployee.length > 0) {
            console.log("Error: Employee ID already exists in employees table:", emp_id);
            return res.status(400).json({ 
                error: `Employee ID ${emp_id} is already in use. Please use a different ID.` 
            });
        }
    } catch (error) {
        console.error("Error checking for existing emp_id in employees table:", error);
        return res.status(500).json({ error: error.message });
    }

    // For employee users, check their current situation
    if (req.user.role === 'employee') {
        try {
            // Check if the user already has an employee record assigned in users table
            const [userRecords] = await pool.query(
                "SELECT emp_id FROM users WHERE id = ? AND emp_id IS NOT NULL", 
                [req.user.userId]
            );
            
            console.log("Existing user records check:", JSON.stringify(userRecords, null, 2));
            
            if (userRecords.length > 0) {
                // User has an emp_id assigned, now check if it matches the requested emp_id
                if (userRecords[0].emp_id === emp_id) {
                    // Check if an employee record exists for this emp_id
                    const [employeeCheck] = await pool.query(
                        "SELECT * FROM employees WHERE emp_id = ?",
                        [emp_id]
                    );
                    
                    // If emp_id matches but no employee record exists, we can proceed to create it
                    if (employeeCheck.length === 0) {
                        console.log("User has emp_id but no employee record exists, will create one");
                    } else {
                        return res.status(400).json({ 
                            error: "You already have an employee record. Please update your existing record instead." 
                        });
                    }
                } else {
                    // User has a different emp_id assigned, don't allow creating a new one
                    console.log("Error: User already has a different emp_id assigned:", userRecords[0].emp_id);
                    return res.status(400).json({ 
                        error: `You already have employee ID ${userRecords[0].emp_id} assigned. Please use that ID instead.` 
                    });
                }
            }
        } catch (error) {
            console.error("Error checking for existing employee record:", error);
            return res.status(500).json({ error: error.message });
        }
    }

    if (!assets || !Array.isArray(assets) || assets.length === 0) {
        console.log("Error: Missing assets or invalid assets array:", assets);
        return res.status(400).json({ error: "At least one asset is required." });
    }

    try {
        console.log("Creating employee with data:", { employee_name, emp_id, location, employee_role, assets });
        // Insert employee data into employees table (changed from testemp)
        await pool.query(
            "INSERT INTO employees(emp_name, emp_id, location, employee_role) VALUES (?,?,?,?)",
            [employee_name, emp_id, location, employee_role]
        );

        // If user is an employee, link this employee record to their user account
        if (req.user.role === 'employee') {
            await pool.query(
                "UPDATE users SET emp_id = ? WHERE id = ?",
                [emp_id, req.user.userId]
            );
        }

        // Process each asset
        const addedAssets = [];
        console.log("Starting to process assets:", JSON.stringify(assets, null, 2));
        
        for (const asset of assets) {
            try {
                console.log("Processing asset:", JSON.stringify(asset, null, 2));
                // Insert into AssetManagement table
                const [result] = await pool.query(
                    "INSERT INTO AssetManagement(Item, Specification, PurchaseDate, WarrantyPeriod, VendorName, VendorContactNo, emp_id) VALUES (?,?,?,?,?,?,?)",
                    [
                        asset.Item,
                        asset.Specification || null,
                        asset.PurchaseDate || null,
                        asset.WarrantyPeriod || null,
                        asset.VendorName || null,
                        asset.VendorContactNo || null,
                        emp_id
                    ]
                );
                
                const assetId = result.insertId;
                console.log("Asset inserted successfully with ID:", assetId);
                addedAssets.push({ 
                    SrNo: assetId,
                    Item: asset.Item
                });
            } catch (assetError) {
                console.error("Error inserting asset:", assetError);
                throw assetError;
            }
        }

        console.log("All assets processed. Added assets:", JSON.stringify(addedAssets, null, 2));

        res.json({
            message: "Employee and asset details saved successfully",
            employeeId: emp_id,
            addedAssets
        });

    } catch (error) {
        console.error("Error creating employee or assets:", error.message, { employee_name, emp_id, location, employee_role, assets });
        res.status(500).json({ error: error.message });
    }
}

export async function deleteEmployee(req, res) {
    const emp_id = req.params.emp_id;

    if (!emp_id) {
        return res.status(400).json({ error: "Employee ID is required." });
    }

    try {
        // Check if the employee record exists
        const [employeeCheck] = await pool.query("SELECT emp_id FROM employees WHERE emp_id = ?", [emp_id]);
        if (employeeCheck.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Find the user linked to this employee ID for authorization purposes
        const [linkedUsers] = await pool.query(
            "SELECT id FROM users WHERE emp_id = ?",
            [emp_id]
        );

        // Authorization check:
        // If user is an employee, make sure they're deactivating their own linked employee record
        if (req.user.role === 'employee') {
            // Check if the requesting user's emp_id matches the one being deactivated
            const [requestingUser] = await pool.query("SELECT emp_id FROM users WHERE id = ?", [req.user.userId]);
            if (!requestingUser || requestingUser.length === 0 || requestingUser[0].emp_id != emp_id) {
                 return res.status(403).json({
                    error: "Unauthorized: You can only deactivate your own employee record."
                });
            }
        }
        // Admin role is implicitly allowed if not 'employee' role and passed middleware

        // Update the employee's status to inactive in the employees table
        const [updateResult] = await pool.query(
            "UPDATE employees SET isactive = false WHERE emp_id = ?",
            [emp_id]
        );

        if (updateResult.affectedRows === 0) {
             // This might happen if the employee was already inactive
             // We already checked if the employee exists, so this likely means it was already inactive.
             const [checkActiveStatus] = await pool.query("SELECT isactive FROM employees WHERE emp_id = ?", [emp_id]);
             if (checkActiveStatus.length > 0 && !checkActiveStatus[0].isactive) {
                 return res.status(200).json({ message: "Employee was already inactive.", deactivatedEmployeeId: emp_id });
             } else {
                 // Should not happen if the initial check passed, but handle defensively
                 return res.status(404).json({ message: "Employee not found or could not be updated." });
             }
        }

        res.json({ message: "Employee deactivated successfully", deactivatedEmployeeId: emp_id });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getAllEmployees(req, res) {
    try {
        // Modified query to join with users table and include email
        const [employees] = await pool.query(`
            SELECT e.*, u.email 
            FROM employees e
            LEFT JOIN users u ON e.emp_id = u.emp_id
            WHERE e.isactive = TRUE
        `);

        const employeesWithAssets = await Promise.all(employees.map(async (employee) => {
            // Get all assets for this employee
            const [assets] = await pool.query(
                "SELECT * FROM AssetManagement WHERE emp_id = ?",
                [employee.emp_id]
            );

            return {
                ...employee,
                assets: assets
            };
        }));

        res.json(employeesWithAssets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getEmployeeById(req, res) {
    const { emp_id } = req.params;

    try {
        // Modified query to join with users table and include email
        const [employees] = await pool.query(
            `SELECT e.*, u.email 
             FROM employees e 
             LEFT JOIN users u ON e.emp_id = u.emp_id 
             WHERE e.emp_id = ?`, 
            [emp_id]
        );

        if (employees.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const employee = employees[0];

        // Get all assets for this employee
        const [assets] = await pool.query(
            "SELECT * FROM AssetManagement WHERE emp_id = ?",
            [emp_id]
        );

        // Combine employee data with assets
        const employeeWithAssets = {
            ...employee,
            assets: assets
        };

        res.json(employeeWithAssets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateEmployee(req, res) {
    const emp_id = req.params.emp_id;
    const updateData = req.body;

    if (!emp_id) {
        return res.status(400).json({ error: "Employee ID is required for update." });
    }

    try {
        // Ensure employee exists
        const [existingEmployee] = await pool.query(
            "SELECT * FROM employees WHERE emp_id = ?", 
            [emp_id]
        );
        
        if (existingEmployee.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // For employees, only allow them to update their own record
        if (req.user.role === 'employee') {
            // Check if this employee record belongs to the user
            const [userEmployee] = await pool.query(
                "SELECT * FROM users WHERE id = ? AND emp_id = ?",
                [req.user.userId, emp_id]
            );
            
            if (userEmployee.length === 0) {
                return res.status(403).json({ 
                    error: "Unauthorized: You can only update your own employee record" 
                });
            }
        }
        
        // Update employee information (removing employee_role from the update)
        await pool.query(
            "UPDATE employees SET emp_name = ?, location = ? WHERE emp_id = ?",
            [updateData.employee_name, updateData.location, emp_id]
        );
        
        // Handle asset updates if provided
        if (updateData.assets && Array.isArray(updateData.assets)) {
            // Process each asset in the update data
            for (const assetUpdate of updateData.assets) {
                // If the asset has an SrNo, it's an update to an existing asset
                if (assetUpdate.SrNo) {
                    // Check if the asset exists and belongs to this employee
                    const [existingAsset] = await pool.query(
                        "SELECT * FROM AssetManagement WHERE SrNo = ? AND emp_id = ?",
                        [assetUpdate.SrNo, emp_id]
                    );
                    
                    if (existingAsset.length === 0) {
                        continue; // Skip this asset if it doesn't exist or doesn't belong to the employee
                    }

                    // Update asset details
                    await pool.query(
                        "UPDATE AssetManagement SET Item = ?, Specification = ?, PurchaseDate = ?, WarrantyPeriod = ?, VendorName = ?, VendorContactNo = ? WHERE SrNo = ?",
                        [
                            assetUpdate.Item,
                            assetUpdate.Specification || null,
                            assetUpdate.PurchaseDate || null,
                            assetUpdate.WarrantyPeriod || null,
                            assetUpdate.VendorName || null,
                            assetUpdate.VendorContactNo || null,
                            assetUpdate.SrNo
                        ]
                    );
                } 
                // If the asset doesn't have an SrNo, it's a new asset to add
                else {
                    // Insert new asset
                    const [assetResult] = await pool.query(
                        "INSERT INTO AssetManagement(Item, Specification, PurchaseDate, WarrantyPeriod, VendorName, VendorContactNo, emp_id) VALUES (?,?,?,?,?,?,?)",
                        [
                            assetUpdate.Item,
                            assetUpdate.Specification || null,
                            assetUpdate.PurchaseDate || null,
                            assetUpdate.WarrantyPeriod || null,
                            assetUpdate.VendorName || null,
                            assetUpdate.VendorContactNo || null,
                            emp_id
                        ]
                    );
                }
            }
            
            // Handle asset removal if indicated
            if (updateData.removeAssets && Array.isArray(updateData.removeAssets)) {
                // Only allow admins to remove assets
                if (req.user.role === 'admin') {
                    for (const assetId of updateData.removeAssets) {
                        // Verify the asset belongs to this employee before deleting
                        const [assetToDelete] = await pool.query(
                            "SELECT * FROM AssetManagement WHERE SrNo = ? AND emp_id = ?",
                            [assetId, emp_id]
                        );
                        
                        if (assetToDelete.length > 0) {
                            await pool.query("DELETE FROM AssetManagement WHERE SrNo = ?", [assetId]);
                        }
                    }
                }
                // Non-admin users: silently ignore the delete request
            }
        }
        
        res.json({ message: "Employee and assets updated successfully", updatedEmployeeId: emp_id });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getEmployeeByUserId(req, res) {
    const userId = req.user.userId;

    try {
        // Get the emp_id associated with this user
        const [userResult] = await pool.query(
            "SELECT emp_id, email FROM users WHERE id = ?",
            [userId]
        );

        if (userResult.length === 0 || !userResult[0].emp_id) {
            return res.status(404).json({ message: "No employee record found for this user" });
        }

        const emp_id = userResult[0].emp_id;
        const email = userResult[0].email;

        // Get employee data
        const [employees] = await pool.query(
            "SELECT * FROM employees WHERE emp_id = ?",
            [emp_id]
        );

        if (employees.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const employee = employees[0];

        // Get all assets for this employee
        const [assets] = await pool.query(
            "SELECT * FROM AssetManagement WHERE emp_id = ?",
            [emp_id]
        );

        // Combine employee data with assets and email
        const employeeWithAssets = {
            ...employee,
            email: email,
            assets: assets
        };

        res.json(employeeWithAssets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function batchImportEmployees(req, res) {
    const { employees } = req.body;
    
    console.log('Starting batch import process with', employees?.length || 0, 'employees');
    
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
        console.log('No valid employees data provided for import');
        return res.status(400).json({ error: "No employees data provided for import" });
    }

    const results = {
        success: 0,
        failed: 0,
        errors: []
    };

    try {
        // Process each employee in the batch
        for (const employeeData of employees) {
            try {
                const { emp_name, emp_id, location, employee_role, assets } = employeeData;
                console.log('Processing employee:', { emp_id, emp_name });
                
                // Validate required fields
                if (!emp_name || !emp_id) {
                    console.log('Missing required fields for employee:', { emp_id: emp_id || 'unknown', emp_name });
                    results.failed++;
                    results.errors.push({ emp_id: emp_id || 'unknown', error: "Missing required fields" });
                    continue;
                }

                // Check if employee already exists
                const [existingEmployees] = await pool.query(
                    "SELECT emp_id FROM employees WHERE emp_id = ?", 
                    [emp_id]
                );
                
                let employeeExists = existingEmployees.length > 0;
                console.log(`Employee ${emp_id} ${employeeExists ? 'exists, updating' : 'does not exist, creating new'}`);
                
                if (employeeExists) {
                    // Update existing employee
                    await pool.query(
                        "UPDATE employees SET emp_name = ?, location = ?, employee_role = ? WHERE emp_id = ?",
                        [emp_name, location || null, employee_role || null, emp_id]
                    );
                    console.log(`Updated existing employee: ${emp_id}`);
                } else {
                    // Insert new employee
                    await pool.query(
                        "INSERT INTO employees(emp_name, emp_id, location, employee_role, isactive) VALUES (?,?,?,?,TRUE)",
                        [emp_name, emp_id, location || null, employee_role || null]
                    );
                    console.log(`Created new employee: ${emp_id}`);
                }
                
                // Delete existing assets for this employee if they exist
                if (employeeExists) {
                    await pool.query("DELETE FROM AssetManagement WHERE emp_id = ?", [emp_id]);
                    console.log(`Deleted existing assets for employee ${emp_id}`);
                }
                
                // Process assets if provided
                if (assets && Array.isArray(assets)) {
                    console.log(`Processing ${assets.length} assets for employee ${emp_id}`);
                    for (const asset of assets) {
                        // Insert asset with direct properties
                        await pool.query(
                            "INSERT INTO AssetManagement(Item, Specification, PurchaseDate, WarrantyPeriod, VendorName, VendorContactNo, emp_id) VALUES (?,?,?,?,?,?,?)",
                            [
                                asset.Item,
                                asset.Specification || null,
                                asset.PurchaseDate || null,
                                asset.WarrantyPeriod || null,
                                asset.VendorName || null,
                                asset.VendorContactNo || null,
                                emp_id
                            ]
                        );
                        console.log(`Added asset ${asset.Item} for employee ${emp_id}`);
                    }
                }
                
                results.success++;
                console.log(`Successfully processed employee ${emp_id}`);
            } catch (error) {
                console.error("Error importing employee:", error, employeeData);
                results.failed++;
                results.errors.push({ 
                    emp_id: employeeData.emp_id || 'unknown',
                    error: error.message 
                });
            }
        }
        
        console.log('Batch import completed with results:', results);
        res.json({
            message: "Batch import completed",
            results
        });
        
    } catch (error) {
        console.error("Batch import failed:", error);
        res.status(500).json({ error: error.message });
    }
}

export async function getPublicEmployeeInfo(req, res) {
    const { token } = req.params;
    
    try {
        let emp_id;
        try {
            // Extract emp_id from token
            if (token.startsWith('emp_')) {
                emp_id = token.substring(4); // Remove 'emp_' prefix
            } else {
                return res.status(400).json({ message: "Invalid token format" });
            }
        } catch (error) {
            return res.status(400).json({ message: "Invalid token" });
        }

        // Get basic employee data
        const [employees] = await pool.query(
            "SELECT emp_id, emp_name, location FROM employees WHERE emp_id = ? AND isactive = TRUE", 
            [emp_id]
        );

        if (employees.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const employee = employees[0];

        // Get assets for this employee
        const [assets] = await pool.query(
            "SELECT SrNo, Item, Specification, PurchaseDate, WarrantyPeriod FROM AssetManagement WHERE emp_id = ?",
            [emp_id]
        );

        // Combine employee data with assets
        const publicEmployeeData = {
            ...employee,
            assets: assets
        };

        res.json(publicEmployeeData);
    } catch (error) {
        console.error("Error retrieving public employee info:", error);
        res.status(500).json({ error: "An error occurred while retrieving employee information" });
    }
}
