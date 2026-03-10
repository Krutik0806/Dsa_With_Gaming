const Module = require('../models/Module');

exports.getAllModules = async (req, res) => {
    try {
        const modules = await Module.find({}, '-__v');
        res.json({ success: true, data: modules });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getModuleById = async (req, res) => {
    try {
        const mod = await Module.findOne({ id: req.params.id }, '-__v');
        if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });
        res.json({ success: true, data: mod });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
