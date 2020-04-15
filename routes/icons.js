const handler = (req, res) => {
  console.log('Icon handler triggered');

  res.redirect(`https://www.dogedoge.com/favicon/${req.params.domain}.ico`);
};

module.exports = handler;
