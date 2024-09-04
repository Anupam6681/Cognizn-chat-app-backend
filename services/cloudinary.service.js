var cloudinary = require("cloudinary");
const path = require("path");
cloudinary.config({
  cloud_name: "dvuyilq0a",
  api_key: "769591115158778",
  api_secret: "N78hmy19sdN978cwIh_yRzyvn1E",
});

module.exports = {
  cloudinaryTranscriberFileUpload: async (file, config, callback) => {
    const fileName = path.basename(file);
    const configOptions = { resource_type: "auto", folder: "transcriber" };
    if (config && config.transcriberId)
      configOptions.tags = config.transcriberId;
    cloudinary.v2.uploader.upload(
      file,
      configOptions,
      function (error, result) {
        if (error) {
          return callback(error);
        }
        callback(result);
      }
    );
  },
};
