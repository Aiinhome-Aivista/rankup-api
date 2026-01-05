const SubjectModel = require("./subject.model");

exports.getSubjectsController = async (req, res) => {
  try {
    const subjects = await SubjectModel.getAllSubjects();

    return res.status(200).json({
      isSuccess: true,
      statusCode: 200,
      message: "Subjects fetched successfully",
      data: subjects
    });

  } catch (error) {
    console.error("Get Subjects Error:", error);

    return res.status(500).json({
      isSuccess: false,
      statusCode: 500,
      message: "Failed to fetch subjects",
      data: null,
      error: error.message
    });
  }
};
