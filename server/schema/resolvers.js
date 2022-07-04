const { AuthenticationError } = require('apollo-server-express');
const { User, Thought } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
          .populate('bookCount')
          .populate('savedBooks');

        return userData;
      }

      throw new AuthenticationError('Not logged in');
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
        console.log(args)
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, {input}, context) => {
      if (context.user) {
        const savedBook = await User.findOneAndUpdate(
            {_id: context.user_id },
            { $push: { savedBooks: input}},
            { new: true, runValidators: true}
        );
        return savedBook;
      }

      throw new AuthenticationError('You need to be logged in!');
    },

    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const removeBooks = await User.findOneAndUpdate(
          { _id: context.user_id },
          { $push: { savedBooks: {bookId: bookId } } },
          { new: true, runValidators: true }
        );

        return removeBooks;
      }

      throw new AuthenticationError('You need to be logged in!');
    },
  }
};

module.exports = resolvers;
