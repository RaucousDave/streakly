
import nodemailer from "nodemailer"

export const sendEmail = async(to: string, link: string) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS
        }
    })

    await transporter.sendMail({
        from: "sagefrugal@gmail.com",
        to,
        subject: "Verify your email",
        text: `Click to verify ${link}`
    })
}