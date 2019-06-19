const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");
// Post Model
const Post = require("../../models/Post");
// Profile model
const Profile = require("../../models/Profile");
// Validator
const validatePostInput = require("../../validation/post");

// @route       GET api/posts/test
// @desc        Tests posts Route
// @access      Public
router.get("/test", (req, res) => res.json({ msg: "posts Works" }));

// @route       GET api/posts/
// @desc        Create Post
// @access      Public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ noposts: "No posts found" }));
});

// @route       GET api/posts/:id
// @desc        Get post by id
// @access      Public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(posts => res.json(posts))
    .catch(err =>
      res.status(404).json({ nopostfound: "No Post found with id" })
    );
});

// @route       POST api/posts/
// @desc        Create Post
// @access      Private

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPost.save().then(post => res.json(post));
  }
);

// @route       DELETE api/posts/:id
// @desc        DELETE Post
// @access      Private
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id).then(post => {
        // Check for post owner
        if (post.user.toString() !== req.user.id) {
          return res
            .status(401)
            .jsonp({ notauthorized: "user not authorized" });
        }

        //DELETE
        post
          .remove()
          .then(() => res.json({ sucess: true }))
          .catch(err =>
            res.status(404).json({ postnotfound: "No post found" })
          );
      });
    });
  }
);

// @route       POST api/posts/like/:id
// @desc        Like post
// @access      Private
router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id).then(post => {
        if (
          post.likes.filter(like => like.user.toString() === req.user.id)
            .length > 0
        ) {
          return res
            .status(400)
            .json({ alreadyliked: "User already liked this post" });
        }

        // Add user id to liked array
        post.likes.unshift({ user: req.user.id });

        post.save().then(post => res.json(post));
      });
    });
  }
);

// @route       POST api/posts/unlike/:id
// @desc        unLike post
// @access      Private
router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id).then(post => {
        if (
          post.likes.filter(like => like.user.toString() === req.user.id)
            .length === 0
        ) {
          return res
            .status(400)
            .json({ notliked: "You have not yet liked this post" });
        }

        // Get the remove index
        const removeIndex = post.likes
          .map(item => item.user.toString())
          .indexOf(req.user.id);
        // Splice out of arrray
        post.likes.splice(removeIndex, 1);
        // Save
        post.save().then(post => res.json(post));
      });
    });
  }
);

// @route       POST api/posts/comment/:id
// @desc        ADD comment to post
// @access      Private
router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then(post => {
        const newcomment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        // add comment to array
        post.comments.unshift(newcomment);
        // Save
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No post found" }));
  }
);

module.exports = router;
