const multer = require('multer');
const path = require('path');

// Multer configuration
const storage = multer.diskStorage({
    destination:{},
    filename: (req, file, cb) => {
        // Create a unique file name using the original name and timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-'-${uniqueSuffix}${path.extname(file.originalname)}`);

    }
});
const upload = multer({ storage });
// Export using CommonJS syntax
module.exports = { upload };
