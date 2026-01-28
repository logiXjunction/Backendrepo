module.exports = (req, res, next) => {
    if (process.env.NODE_ENV !== "development") {
        return res.status(403).json({
            success: false,
            message: "Admin bypass not allowed",
        });
    }

    // Fake admin object for development
    req.admin = {
        id: 1,
        name: "DEV ADMIN",
        email: "dev@admin.local",
        role: "admin",
    };

    next();
};
