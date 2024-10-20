exports.getHomePage = (req, res) => {
    res.render('index', { title: 'Home' }); // No need to manually include layout, it's automatic
};
