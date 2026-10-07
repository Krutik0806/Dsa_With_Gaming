"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const season_archive_1 = require("../lib/season-archive");
const router = (0, express_1.Router)();
router.get("/", auth_1.requireAuth, (req, res) => {
    res.json((0, season_archive_1.getSeasonArchive)(req.user.rating));
});
exports.default = router;
//# sourceMappingURL=seasons.js.map