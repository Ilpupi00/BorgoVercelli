const mockSendMail = jest.fn().mockResolvedValue({ messageId: "1234-abcd" });
const mockVerify = jest.fn().mockResolvedValue(true);

jest.mock("nodemailer", () => ({
    createTransport: jest.fn(() => ({
        sendMail: mockSendMail,
        verify: mockVerify
    }))
}));

jest.mock("fs", () => {
    const actualFs = jest.requireActual("fs");
    return {
        ...actualFs,
        existsSync: jest.fn(() => false),
        readFileSync: jest.fn()
    };
});

const emailService = require("../src/shared/services/email-service");
const nodemailer = require("nodemailer");

describe("Service: Email Service (SMTP/APIs)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSendMail.mockResolvedValue({ messageId: "1234-abcd" });
        mockVerify.mockResolvedValue(true);
    });

    describe("sendEmail (Generic Contact)", () => {
        it("should format email correctly and execute send using nodemailer", async () => {
            const formData = {
                fromName: "Lucio",
                fromEmail: "lucio@test.com",
                subject: "Questionari",
                message: "Questo è il messaggio body.",
                phone: "+39 123456"
            };

            const response = await emailService.sendEmail(formData);

            expect(response.messageId).toBe("1234-abcd");
            expect(mockSendMail).toHaveBeenCalled();

            // Intercetta la chiamata
            const emailCall = mockSendMail.mock.calls[0][0];
            expect(emailCall.replyTo).toBe("Lucio <lucio@test.com>");
            expect(emailCall.to).toBe("info.asdborgovercelli2022@gmail.com");
            expect(emailCall.subject).toBe("Questionari");
            // Controlliamo che l'HTML contenga i nostri params
            expect(emailCall.html).toContain("Questo è il messaggio");
            expect(emailCall.html).toContain("+39 123456");
        });

        it("should use generic subjects if empty", async () => {
             const response = await emailService.sendEmail({
                 fromName: "Anna",
                 fromEmail: "anna@z.com",
                 message: "Message",
                 subject: ""
             });

             const emailCall = mockSendMail.mock.calls[0][0];
             expect(emailCall.subject).toBe("Nuovo messaggio da Anna - Borgo Vercelli");
        });

        it("should apply retry logic correctly if nodemailer throws ETIMEDOUT network failure", async () => {
            // First time fails with ETIMEDOUT, 2nd passes
            const timeoutErr = new Error("ETIMEDOUT");
            timeoutErr.code = "ETIMEDOUT";

            mockSendMail
                .mockRejectedValueOnce(timeoutErr)
                .mockResolvedValueOnce({ messageId: "delayed-123" });

            const promise = emailService.sendEmail({
                 fromName: "B",
                 fromEmail: "B@b.com",
                 message: "M"
            });
            // Should eventually resolve because of the retry wrapper handling it implicitly
            await expect(promise).resolves.toHaveProperty("messageId", "delayed-123");
            expect(mockSendMail).toHaveBeenCalledTimes(2);
        });

        it("should directly throw unhandled/hard SMTP errors instantly", async () => {
             const authErr = new Error("AUTH_FAILED");
             authErr.code = "EAUTH"; // Standard auth block code, no retry

             mockSendMail.mockRejectedValue(authErr);

             await expect(emailService.sendEmail({ fromName: "C", fromEmail: "c@c", message: "m" }))
               .rejects.toThrow("AUTH_FAILED");
               
             expect(mockSendMail).toHaveBeenCalledTimes(1); // Didn't retry
        });
    });

    describe("sendResetEmail", () => {
        it("should compile recovery templates heavily matching specifications", async () => {
             await emailService.sendResetEmail("user@user.it", "https://reset.link");

             const emailCall = mockSendMail.mock.calls[0][0];
             expect(emailCall.to).toBe("user@user.it");
             expect(emailCall.subject).toBe("Reset della tua password - Borgo Vercelli");
             expect(emailCall.html).toContain("https://reset.link");
        });
    });

    describe("sendSospensioneEmail", () => {
        it("should format suspension data and reasons safely", async () => {
             const suspDate = new Date("2026-10-10T12:00:00Z");
             await emailService.sendSospensioneEmail("ban@ban.com", "Hacker", "Multiple spam", suspDate);

             const emailCall = mockSendMail.mock.calls[0][0];
             expect(emailCall.to).toBe("ban@ban.com");
             expect(emailCall.subject).toBe("Account Sospeso - Borgo Vercelli");
             expect(emailCall.html).toContain("Hacker");
             expect(emailCall.html).toContain("Multiple spam");
        });
    });
});
