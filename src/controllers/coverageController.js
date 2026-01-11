const Coverage = require("../models/coverage");

const saveCoverage = async (req, res) => {
  try {
    const transporterId = req.transporter.id;
    const { servicesOffered, pickup, drop } = req.body;

    if (!Array.isArray(servicesOffered) || servicesOffered.length === 0) {
      return res.status(400).json({ message: "At least one service is required" });
    }

    let coverage = await Coverage.findOne({ where: { transporterId } });

    if (!coverage) {
      coverage = await Coverage.create({
        transporterId,
        servicesOffered,
        pickup,
        drop,
      });
    } else {
      await coverage.update({
        servicesOffered,
        pickup,
        drop,
      });
    }

    return res.status(200).json({
      message: "Coverage saved successfully",
      coverage,
    });
  } catch (err) {
    console.error("Save coverage error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCoverage = async (req, res) => {
  try {
    const transporterId = req.transporter.id;

    const coverage = await Coverage.findOne({ where: { transporterId } });

    if (!coverage) {
      return res.status(200).json({
        servicesOffered: [],
        pickup: { panIndia: false, locations: [] },
        drop: { panIndia: false, locations: [] },
      });
    }

    return res.status(200).json(coverage);
  } catch (err) {
    console.error("Get coverage error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  saveCoverage,
  getCoverage,
};
