const express = require("express");
const Favorite = require("../models/favorites");
const authenticate = require("../authenticate");
const cors = require("./cors");
const { update } = require("../models/favorites");
const favoriteRouter = express.Router();

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Favorite.find({ user: req.user._id })
      .populate("user")
      .populate("campsites")
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          // Placeholder code, will change later
          res.statusCode = 200;
          // If User has favorites already, check if campsite ids under that user already exist
          const existingCampsiteIds = favorite.campsites;

          // Now concat whatever campsite ids in the req body to the favorite campsite ids array

          // We need to ensure there's no duplicates, if there's a duplicate, don't add the campsite again
          // Compare campsiteIds vs req.body (campsite IDs are in here)
          req.body.forEach((message) => {
            console.log("Campsite Id: ", message._id);
            // Check if message._id exists in existingCampsiteIds, if not, add it
            if (!existingCampsiteIds.includes(message._id)) {
              existingCampsiteIds.push(message._id);
            }
          });

          favorite
            .save()
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        } else {
          Favorite.create({ user: req.user._id, campsites: req.body })
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        }
      })
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /favorites");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({ user: req.user._id })
      .then((favorite) => {
        // If favorite found
        if (favorite) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        } else {
          res.setHeader("Content-Type", "text/plain");
          res.end("You do not have any favorites to delete");
        }
      })
      .catch((err) => next(err));
  });

favoriteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `GET operation is not supported on /favorites/${req.params.campsiteId}`
    );
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          console.log("Request campsite id: ", req.params.campsiteId);
          res.statusCode = 200;
          //res.json(favorite.campsites);
          // Check if req.params.campsiteId exists in favorites.campsites
          if (favorite.campsites.includes(req.params.campsiteId)) {
            res.end("That campsite is already in the list of favorites!");
          } else {
            // Add the campsite id to campsites
            favorite.campsites.push(req.params.campsiteId);
            favorite
              .save()
              .then((favorite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
              })
              .catch((err) => next(err));
          }
        } else {
          // This user does not have any favorites, let's add favorites for this user
          Favorite.create({
            user: req.user._id,
            campsites: req.params.campsiteId,
          })
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        }
      })
      .catch((err) => next(err));
  })

  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `PUT operation is not supported on /favorites/${req.params.campsiteId}`
    );
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          //res.json(favorite);

          // Look for req.params.campsiteId in Campsites array for the favorite found
          if (favorite.campsites.includes(req.params.campsiteId)) {
            // If it's in here, remove from the array
            const updatedCampsiteIds = favorite.campsites.filter(
              (campsite) => campsite === req.params.campsiteId
            );
            //res.json(updatedCampsiteIds);
            favorite.campsites = updatedCampsiteIds;
            //res.json(favorite.campsites);
            favorite
              .save()
              .then((favorite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
              })
              .catch((err) => next(err));
          } else {
            res.setHeader("Content-Type", "text/plain");
            res.end("You do not have any favorites to delete");
          }
        } else {
          res.setHeader("Content-Type", "text/plain");
          res.end("You do not have any favorites to delete");
        }
      })
      .catch((err) => next(err));
  });
module.exports = favoriteRouter;
