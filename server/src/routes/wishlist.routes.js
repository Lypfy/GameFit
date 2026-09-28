const express = require("express");
const router = express.Router();
const wishlistController = require('../controller/wishlist.controller');

router.get('/:user_id', wishlistController.getWishlistGames);
router.delete('/:user_id', wishlistController.deleteWishlistGame);
router.post('/:user_id', wishlistController.addWishlistGame);

module.exports = router