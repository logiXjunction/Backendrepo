const Quotation = require('../models/quotation')

const submitQuotation = async (req, res, next) => {
    try {
        const transporterId = req.transporter.id;
        const {
            FtlId,
            baseFreight,
            odaCharges,
            detentionCharges,
            otherCharges,
            additionalNotes,
            canMeetDates,
            expectedPickupDate,
            expectedDeliveryDate,
            canMeetLabour,
            labourCharges
        } = req.body;

        // Check if already quoted (Double safety check)
        const existing = await Quotation.findOne({ where: { FtlId, transporterId } });
        if (existing) {
            return res.status(400).json({ success: false, message: "You have already quoted for this shipment" });
        }

        const newQuote = await Quotation.create({
            FtlId,
            transporterId,
            baseFreight,
            odaCharges,
            detentionCharges,
            otherCharges,
            additionalNotes,
            canMeetDates,
            expectedPickupDate: canMeetDates === 'no' ? expectedPickupDate : null,
            expectedDeliveryDate: canMeetDates === 'no' ? expectedDeliveryDate : null,
            canMeetLabour,
            labourCharges: canMeetLabour === 'yes' ? labourCharges : 0
        });

        return res.status(201).json({
            success: true,
            message: "Quotation submitted successfully",
            data: newQuote
        });
    } catch (error) {
        console.error('Error submitting quotation:', error);
        next(error);
    }
};