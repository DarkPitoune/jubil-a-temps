const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Connect to SQLite database
const dbPath = path.join(__dirname, "..", "timetracker.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("SQLite connection error:", err);
    process.exit(1);
  } else {
    console.log(`Connected to SQLite database at ${dbPath}`);
  }
});

// Migration function to add userId column and update all shifts to use userId = 2
const migrateShifts = () => {
  // First, check if user ID 2 exists
  db.get("SELECT * FROM users WHERE id = 2", [], (err, user) => {
    if (err) {
      console.error("Error checking for user ID 2:", err.message);
      closeDbAndExit(1);
    }
    
    if (!user) {
      console.error("User with ID 2 does not exist. Migration cannot proceed.");
      console.log("Please create this user first or modify the script to use an existing user ID.");
      closeDbAndExit(1);
    }
    
    // Check if userId column exists in shifts table
    db.get("PRAGMA table_info(shifts)", [], (err, tableInfo) => {
      if (err) {
        console.error("Error retrieving table information:", err.message);
        closeDbAndExit(1);
      }
      
      // Check if userId column exists
      db.all("PRAGMA table_info(shifts)", [], (err, columns) => {
        if (err) {
          console.error("Error getting table columns:", err.message);
          closeDbAndExit(1);
        }
        
        const userIdColumnExists = columns.some(column => column.name === 'userId');
        
        if (!userIdColumnExists) {
          console.log("userId column does not exist in shifts table. Adding it now...");
          
          // Add userId column if it doesn't exist
          db.run("ALTER TABLE shifts ADD COLUMN userId INTEGER REFERENCES users(id)", [], function(err) {
            if (err) {
              console.error("Error adding userId column:", err.message);
              closeDbAndExit(1);
            }
            console.log("Successfully added userId column to shifts table");
            updateShifts();
          });
        } else {
          console.log("userId column already exists in shifts table");
          updateShifts();
        }
      });
    });
  });
};

// Update all shifts to have userId = 2
const updateShifts = () => {
  // Count shifts with null userId
  db.get("SELECT COUNT(*) as count FROM shifts WHERE userId IS NULL", [], (err, result) => {
    if (err) {
      console.error("Error counting shifts:", err.message);
      closeDbAndExit(1);
    }
    
    const shiftsToUpdate = result.count;
    console.log(`Found ${shiftsToUpdate} shifts that need to be updated`);
    
    if (shiftsToUpdate === 0) {
      console.log("No shifts to update. All shifts already have a userId.");
      closeDbAndExit(0);
    }
    
    // Update all shifts without a userId to user ID 2
    db.run("UPDATE shifts SET userId = 2 WHERE userId IS NULL", [], function(err) {
      if (err) {
        console.error("Error updating shifts:", err.message);
        closeDbAndExit(1);
      }
      
      console.log(`Successfully updated ${this.changes} shifts to userId = 2`);
      
      // Verify all shifts now have a userId
      db.get("SELECT COUNT(*) as count FROM shifts WHERE userId IS NULL", [], (err, result) => {
        if (err) {
          console.error("Error verifying migration:", err.message);
          closeDbAndExit(1);
        }
        
        if (result.count > 0) {
          console.warn(`Warning: ${result.count} shifts still have null userId`);
        } else {
          console.log("Verification successful: All shifts now have a userId");
        }
        
        closeDbAndExit(0);
      });
    });
  });
};

// Helper function to close the database connection and exit
const closeDbAndExit = (code) => {
  db.close((err) => {
    if (err) {
      console.error("Error closing database connection:", err.message);
      process.exit(1);
    }
    console.log("Database connection closed");
    process.exit(code);
  });
};

// Run the migration
console.log("Starting shift migration...");
migrateShifts();