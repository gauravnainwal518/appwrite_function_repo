module.exports = async ({ req, res, log, error }) => {
  log("Test Function Triggered");

  return res.json({
    statusCode: 200,
    output: "This is a test response from Appwrite function"
  });
};
