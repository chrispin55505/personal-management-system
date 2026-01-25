const adminController = {
    dashboard: (req, res) => {
        res.render('admin/dashboard', { title: 'Admin Dashboard' });
    }
};

module.exports = adminController;
