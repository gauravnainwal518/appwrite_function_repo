module.exports = async ({ req, res, log }) => {
  log("Returning dummy output from function");

  return res.json({
    statusCode: 200,
    output: "This is a test response from Appwrite function"
  });
};
