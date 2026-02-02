const Document = require("../models/document");
const getSignedS3Url = require("../config/s3SignedUrl");

const VALID_DOCS = [
    "gst",
    "pan",
    "aadhar",
    "cancelledCheck",
    "passBookCopy",
];

/* ======================================================
   ✅ APPROVE DOCUMENT
====================================================== */
exports.approveDocument = async (req, res) => {
    try {
        const { transporterId, docKey } = req.params;

        if (!VALID_DOCS.includes(docKey)) {
            return res.status(400).json({ message: "Invalid document key" });
        }

        const document = await Document.findOne({
            where: { transporterId },
        });

        if (!document || !document[docKey]?.isSubmitted) {
            return res.status(404).json({ message: "Document not found" });
        }

        const updatedDoc = {
            ...document[docKey],
            isSubmitted: true,
            isVerified: "true",
            description: "",
        };

        await document.update({
            [docKey]: updatedDoc,
        });

        return res.json({
            success: true,
            message: `${docKey} approved successfully`,
            document: updatedDoc,
        });
    } catch (err) {
        console.error("approveDocument error:", err);
        res.status(500).json({ message: "Approve failed" });
    }
};

/* ======================================================
   ❌ REJECT DOCUMENT (WITH DESCRIPTION)
====================================================== */
exports.rejectDocument = async (req, res) => {
    try {
        const { transporterId, docKey } = req.params;
        const { description } = req.body;

        if (!VALID_DOCS.includes(docKey)) {
            return res.status(400).json({ message: "Invalid document key" });
        }

        if (!description || description.trim().length < 5) {
            return res.status(400).json({
                message: "Rejection reason is required (min 5 chars)",
            });
        }

        const document = await Document.findOne({
            where: { transporterId },
        });

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        const updatedDoc = {
            ...document[docKey],
            isSubmitted: false,       // 🔑 reopen upload
            isVerified: "rejected",
            key: null,
            description,             // 🔑 save reason
        };

        await document.update({
            [docKey]: updatedDoc,
        });

        return res.json({
            success: true,
            message: `${docKey} rejected successfully`,
            document: updatedDoc,
        });
    } catch (err) {
        console.error("rejectDocument error:", err);
        res.status(500).json({ message: "Reject failed" });
    }
};

/* ======================================================
   👁 VIEW DOCUMENT (SIGNED URL)
====================================================== */
exports.getAdminDocumentUrl = async (req, res) => {
    try {
        const { transporterId, docKey } = req.params;

        if (!VALID_DOCS.includes(docKey)) {
            return res.status(400).json({ message: "Invalid document key" });
        }

        const document = await Document.findOne({
            where: { transporterId },
        });

        if (!document || !document[docKey]?.key) {
            return res.status(404).json({ message: "Document not available" });
        }

        const signedUrl = await getSignedS3Url(document[docKey].key);

        return res.json({
            success: true,
            url: signedUrl,
        });
    } catch (err) {
        console.error("getAdminDocumentUrl error:", err);
        res.status(500).json({ message: "Failed to fetch document" });
    }
};

