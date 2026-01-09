const db = require("../../config/database");


exports.getAllSubjects = async () => {
  const [rows] = await db.query(
    "SELECT subject_id, subject_name FROM subjects"
  );
  return rows;
};





