const auth = require('../auth')
const bcrypt = require('bcryptjs')

getLoggedIn = async (req, res) => {
    try {
        let userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(200).json({
                loggedIn: false,
                user: null,
                errorMessage: "?"
            })
        }

        const db = req.app.locals.db;
        const loggedInUser = await db.findUserById(userId);
        console.log("loggedInUser: " + loggedInUser);

        return res.status(200).json({
            loggedIn: true,
            user: {
                firstName: loggedInUser.firstName,
                lastName: loggedInUser.lastName,
                userName: loggedInUser.userName,
                email: loggedInUser.email,
                avatarImage: loggedInUser.avatarImage
            }
        })
    } catch (err) {
        console.log("err: " + err);
        res.json(false);
    }
}

loginUser = async (req, res) => {
    console.log("loginUser");
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ errorMessage: "Please enter all required fields." });
        }

        const db = req.app.locals.db;
        const existingUser = await db.findUserByEmail(email);
        console.log("existingUser: " + existingUser);
        if (!existingUser) {
            return res
                .status(401)
                .json({
                    errorMessage: "Wrong email or password provided."
                })
        }

        console.log("provided password: " + password);
        const passwordCorrect = await bcrypt.compare(password, existingUser.passwordHash);
        if (!passwordCorrect) {
            console.log("Incorrect password");
            return res
                .status(401)
                .json({
                    errorMessage: "Wrong email or password provided."
                })
        }

        // LOGIN THE USER
        const userId = String(existingUser._id ?? existingUser.id);
        const token = auth.signToken(userId);
        console.log(token);

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        }).status(200).json({
            success: true,
            user: {
                firstName: existingUser.firstName,
                lastName: existingUser.lastName,
                userName: existingUser.userName,
                email: existingUser.email,
                avatarImage: existingUser.avatarImage
            }
        })

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}

logoutUser = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: true,
        sameSite: "none"
    }).send();
}

registerUser = async (req, res) => {
    console.log("REGISTERING USER IN BACKEND");
    try {
        const { firstName, lastName, userName, email, password, passwordVerify, avatarImage } = req.body;
        console.log("create user: " + userName + " " + email);
        
        // Validate required fields 
        if (!userName || !email || !password || !passwordVerify) {
            return res
                .status(400)
                .json({ errorMessage: "Please enter all required fields." });
        }
        console.log("all fields provided");
        
        if (password.length < 8) {
            return res
                .status(400)
                .json({
                    errorMessage: "Please enter a password of at least 8 characters."
                });
        }
        console.log("password long enough");
        
        if (password !== passwordVerify) {
            return res
                .status(400)
                .json({
                    errorMessage: "Please enter the same password twice."
                })
        }
        console.log("password and password verify match");
        
        // Validate avatar image if provided
        const avatarValidation = validateAvatarImage(avatarImage);
        if (avatarValidation !== true) {
            return res
                .status(400)
                .json({ errorMessage: avatarValidation });
        }
        
        const db = req.app.locals.db;
        const existingUser = await db.findUserByEmail(email);
        console.log("existingUser: " + existingUser);
        if (existingUser) {
            return res
                .status(400)
                .json({
                    success: false,
                    errorMessage: "An account with this email address already exists."
                })
        }

        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(password, salt);
        console.log("passwordHash: " + passwordHash);

        const savedUser = await db.createUser({ 
            firstName: firstName || '', 
            lastName: lastName || '', 
            userName, 
            email, 
            passwordHash,
            avatarImage: avatarImage || null
        });
        console.log("new user saved: " + savedUser._id);

        // LOGIN THE USER
        const savedId = String(savedUser._id ?? savedUser.id);
        console.log("new user saved: " + savedId);
        const token = auth.signToken(savedId);
        console.log("token:" + token);

        await res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        }).status(200).json({
            success: true,
            user: {
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                userName: savedUser.userName,
                email: savedUser.email,
                avatarImage: savedUser.avatarImage
            }
        })

        console.log("token sent");

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}

// Helper function to validate avatar image
// Returns true if valid, error message if invalid
const validateAvatarImage = (avatarImage) => {
    if (!avatarImage) return true; // Optional field
    
    // Check if it's a valid base64 string
    const base64Pattern = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
    if (!base64Pattern.test(avatarImage)) {
        return "Invalid image format. Please upload a PNG, JPG, GIF, or WebP image.";
    }
    
    const sizeInBytes = (avatarImage.length * 3) / 4;
    const maxSizeInBytes = 1.5 * 1024 * 1024; // 1.5MB
    if (sizeInBytes > maxSizeInBytes) {
        return "Image is too large. Please upload an image smaller than 1MB.";
    }
    
    return true;
}

updateUser = async (req, res) => {
    console.log("UPDATING USER IN BACKEND");
    try {
        let userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(401).json({
                errorMessage: "Unauthorized. Please login."
            });
        }

        const { userName, email, password, passwordVerify, avatarImage } = req.body;
        
        // Validate required fields
        if (!userName || !email) {
            return res
                .status(400)
                .json({ errorMessage: "User name and email are required." });
        }

        // If updating password, validate it
        if (password) {
            if (password.length < 8) {
                return res
                    .status(400)
                    .json({
                        errorMessage: "Please enter a password of at least 8 characters."
                    });
            }
            if (password !== passwordVerify) {
                return res
                    .status(400)
                    .json({
                        errorMessage: "Please enter the same password twice."
                    });
            }
        }

        // Validate avatar image if provided
        const avatarValidation = validateAvatarImage(avatarImage);
        if (avatarValidation !== true) {
            return res
                .status(400)
                .json({ errorMessage: avatarValidation });
        }

        const db = req.app.locals.db;
        
        // Check if email is being changed and if new email already exists
        const currentUser = await db.findUserById(userId);
        if (email !== currentUser.email) {
            const existingUser = await db.findUserByEmail(email);
            if (existingUser) {
                return res
                    .status(400)
                    .json({
                        errorMessage: "An account with this email address already exists."
                    });
            }
        }

        // Build update object
        const updateData = {
            userName,
            email,
            avatarImage: avatarImage !== undefined ? avatarImage : currentUser.avatarImage
        };

        // Hash new password if provided
        if (password) {
            const saltRounds = 10;
            const salt = await bcrypt.genSalt(saltRounds);
            updateData.passwordHash = await bcrypt.hash(password, salt);
        }

        const updatedUser = await db.updateUserById(userId, updateData);
        
        if (!updatedUser) {
            return res
                .status(404)
                .json({ errorMessage: "User not found." });
        }

        console.log("user updated: " + userId);

        return res.status(200).json({
            success: true,
            user: {
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                userName: updatedUser.userName,
                email: updatedUser.email,
                avatarImage: updatedUser.avatarImage
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}

module.exports = {
    getLoggedIn,
    registerUser,
    loginUser,
    logoutUser,
    updateUser
}