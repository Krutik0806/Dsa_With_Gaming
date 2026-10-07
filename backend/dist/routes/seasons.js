"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Seasons route ────────────────────────────────────────────────────────────
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const season_archive_1 = require("../lib/season-archive");
const router = (0, express_1.Router)();
router.get("/", auth_1.optionalAuth, (_req, res) => {
    res.json({ seasons: season_archive_1.SEASONS });
});
exports.default = router;
//# sourceMappingURL=seasons.js.map