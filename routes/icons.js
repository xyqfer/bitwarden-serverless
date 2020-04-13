const handler = (req, res) => {
  console.log('Icon handler triggered');

  const icon = encodeURIComponent('https://' + req.params.domain + '/favicon.ico');
  res.redirect(process.env.IMAGE_PROXY + icon);
};

module.exports = handler;
