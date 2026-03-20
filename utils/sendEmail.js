
import nodemailer from 'nodemailer';
export const sendEmail = async (mailData) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const result = await transporter.sendMail(mailData, function (err, info) {
      console.log(err, info);
    });
    console.log(result);
    return result;
  } catch (error) {
    return error;
  }
};
