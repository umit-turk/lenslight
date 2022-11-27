import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Photo from "../models/photoModel.js";

const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({
      user: user._id,
    });
  } catch (error) {
    console.log("error", error);

    let errors = {};

    if (error.code === 11000 && error.keyPattern.email == 1) {
      errors.email = "The Email is already registered";
    }
    if (error.code === 11000 && error.keyPattern.username == 1) {
      errors.username = "The Username is already registered";
    }

    if (error.name === "ValidationError") {
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
    }
    console.log("errors2", errors);
    res.status(400).json(errors);
  }
};

const loginUser = async (req, res) => {
  try {
    //We can take username and password from req.body
    const { username, password } = req.body;

    //We should be find the username from db
    const user = await User.findOne({ username });

    let same = false;
    //if user is true, we have to compare password and db password
    if (user) {
      same = await bcrypt.compare(password, user.password);
    } else {
      return res.status(401).json({
        succeded: false,
        error: "There is no such user",
      });
    }

    if (same) {
      const token = createToken(user._id);
      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
      });

      res.redirect("/users/dashboard");
    } else {
      res.status(401).json({
        succeded: false,
        error: "Password are not match",
      });
    }
  } catch (error) {
    res.status(500).json({
      succeded: false,
      error,
    });
  }
};

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

const getDashboardPage = async (req, res) => {
  const photos = await Photo.find({ user: res.locals.user._id });
  const user = await User.findById({ _id: res.locals.user._id }).populate([
    "followings",
    "followers",
  ]);
  res.render("dashboard", {
    link: "dashboard",
    photos,
  });
};

const getAllUsers = async (req, res) => {
  try {
    //ne = not equel
    const users = await User.find({ _id: { $ne: res.locals.user._id } });
    res.status(200).render("users", {
      users,
      link: "users",
    });
  } catch (error) {
    res.status(500).json({
      succeded: false,
      error,
    });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById({ _id: req.params.id });
    const photos = await Photo.find({ user: user._id });
    res.status(200).render("user", {
      user,
      photos,
      link: "users",
    });
  } catch (error) {
    res.status(500).json({
      succeded: false,
      error,
    });
  }
};

const follow = async (req, res) => {
  try {
    let user = await User.findByIdAndUpdate(
      { _id: req.params.id },
      {
        $push: { followers: res.locals.user._id },
      },
      //when I follow the user, then return a new user
      { new: true }
    );

    user = await User.findByIdAndUpdate(
      { _id: res.locals.user._id },
      {
        $push: { followings: req.params.id },
      },
      { new: true }
    );
    res.status(200).json({
      succeded: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      succeded: false,
      error,
    });
  }
};

const unFollow = async (req, res) => {
  try {
    let user = await User.findByIdAndUpdate(
      { _id: req.params.id },
      {
        $pull: { followers: res.locals.user._id },
      },
      //when I follow the user, then return a new user
      { new: true }
    );

    user = await User.findByIdAndUpdate(
      { _id: res.locals.user._id },
      {
        $pull: { followings: req.params.id },
      },
      { new: true }
    );
    res.status(200).json({
      succeded: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      succeded: false,
      error,
    });
  }
};

export {
  createUser,
  loginUser,
  getDashboardPage,
  getAllUsers,
  getUser,
  follow,
  unFollow,
};
