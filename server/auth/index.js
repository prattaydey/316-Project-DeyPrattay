const jwt = require("jsonwebtoken")

function authManager() {
    verify = (req, res, next) => {
        console.log("req: " + req);
        console.log("next: " + next);
        console.log("Who called verify?");
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({
                    loggedIn: false,
                    user: null,
                    errorMessage: "Unauthorized"
                })
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Decoded token:", decoded);
            if (!decoded.userId) {
                return res.status(401).json({
                    loggedIn: false,
                    user: null,
                    errorMessage: "Invalid token payload"
                });
            }
            req.userId = decoded.userId;
            next();
        } catch (err) {
            console.error(err);
            return res.status(401).json({
                loggedIn: false,
                user: null,
                errorMessage: "Unauthorized"
            });
        }
    }

    verifyUser = (req) => {
        try {
            const token = req.cookies.token;
            if (!token) {
                return null;
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded.userId || null;
        } catch (err) {
            return null;
        }
    }

    signToken = (userId) => {
        if (!userId) throw new Error("signToken called without userId");
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET,
        );
    }

    return this;
}

const auth = authManager();
module.exports = auth;