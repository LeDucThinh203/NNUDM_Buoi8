const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");

const User = require("../schemas/users");
const Role = require("../schemas/roles");
const { sendNewUserPassword } = require("../utils/senMailHandler");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/NNPTUD-C6";

function generateRandomPassword(length) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = crypto.randomBytes(length * 2);
    let result = "";

    for (let i = 0; i < bytes.length && result.length < length; i++) {
        result += charset[bytes[i] % charset.length];
    }

    return result;
}

function parseUsersCsv(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");

    return content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(1)
        .map((line) => {
            const [username, email] = line.split(",").map((item) => item.trim());
            return { username, email };
        })
        .filter((item) => item.username && item.email);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getOrCreateUserRole() {
    let role = await Role.findOne({ name: { $regex: /^user$/i }, isDeleted: false });
    if (!role) {
        role = await Role.create({
            name: "user",
            description: "Default user role",
        });
    }
    return role;
}

async function importUsers(csvPath) {
    const fullPath = path.resolve(csvPath);
    const users = parseUsersCsv(fullPath);

    if (users.length === 0) {
        throw new Error("CSV khong co du lieu hop le.");
    }

    await mongoose.connect(MONGO_URI);
    const userRole = await getOrCreateUserRole();

    let created = 0;
    let updated = 0;
    let emailed = 0;
    let failedEmail = 0;

    for (const row of users) {
        const randomPassword = generateRandomPassword(16);

        let user = await User.findOne({ username: row.username });
        if (!user) {
            user = new User({
                username: row.username,
                email: row.email,
                password: randomPassword,
                role: userRole._id,
                status: true,
            });
            await user.save();
            created += 1;
        } else {
            user.email = row.email;
            user.password = randomPassword;
            user.role = userRole._id;
            user.status = true;
            await user.save();
            updated += 1;
        }

        try {
            await sendNewUserPassword(row.email, row.username, randomPassword);
            emailed += 1;
            await sleep(1500); // Thêm dòng này: chờ 1.5 giây giữa các lần gửi
        } catch (error) {
            failedEmail += 1;
            console.error(`Khong gui duoc mail cho ${row.email}: ${error.message}`);
        }
    }

    console.log("Import users hoan tat.");
    console.log(`Tong user trong file: ${users.length}`);
    console.log(`Da tao moi: ${created}`);
    console.log(`Da cap nhat: ${updated}`);
    console.log(`Gui mail thanh cong: ${emailed}`);
    console.log(`Gui mail that bai: ${failedEmail}`);

    await mongoose.disconnect();
}

const csvArg = process.argv[2] || "data/users-import.csv";

importUsers(csvArg)
    .catch(async (error) => {
        console.error(error.message);
        try {
            await mongoose.disconnect();
        } catch (disconnectError) {
            // Ignore disconnect errors in failure path.
        }
        process.exit(1);
    });
