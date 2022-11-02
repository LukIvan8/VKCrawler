const axios = require("axios").default;

module.exports = function postPost(content) {
  let title = removeTags(value).split("\n").shift();
  const requestBody = {
    title: title,
    contentFormat: "html",
    content: content,
    publishStatus: "public",
  };
  const userId =
    "1a4dfb84ee6dc159df5f31f00fdaac504ccdae774e13a15f3df413cdf576e66cb";
  const url = `https://api.medium.com/v1/users/${userId}/posts`;
  const mediumToken =
    "2318c37b16cb442b27e918005317a59d1495cc3de751e4b5092681370bc88e71d";
  axios.post(url, requestBody, {
    headers: { Authorization: "Bearer " + mediumToken },
  });
};
