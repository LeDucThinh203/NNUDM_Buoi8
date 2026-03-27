const nodemailer = require("nodemailer");

// Create a transporter using Ethereal test credentials.
// For production, replace with your actual SMTP server details.
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 587,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: process.env.MAILTRAP_USER || "",
        pass: process.env.MAILTRAP_PASS || "",
    },
});
//http://localhost:3000/api/v1/auth/resetpassword/a87edf6812f235e997c7b751422e6b2f5cd95aa994c55ebeeb931ca67214d645

// Send an email using async/await;
module.exports = {
    sendMail: async function (to,url) {
        const info = await transporter.sendMail({
            from: 'admin@hehehe.com',
            to: to,
            subject: "reset pass",
            text: "click vo day de doi pass", // Plain-text version of the message
            html: "click vo <a href="+url+">day</a> de doi pass", // HTML version of the message
        });
    },
    sendNewUserPassword: async function (to, username, password) {
        await transporter.sendMail({
            from: "admin@hehehe.com",
            to: to,
            subject: "Tai khoan moi cua ban",
            text: "Xin chao " + username + ". Mat khau tam thoi cua ban la: " + password,
            html:
                "<div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#222;\">" +
                "<h2>Thong tin tai khoan</h2>" +
                "<p>Xin chao <b>" + username + "</b>,</p>" +
                "<p>Tai khoan cua ban da duoc tao/cap nhat thanh cong.</p>" +
                "<p>Mat khau tam thoi: <b>" + password + "</b></p>" +
                "<p>Vui long dang nhap va doi mat khau ngay sau lan dau su dung.</p>" +
                "</div>",
        });
    },
}