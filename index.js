const express = require('express');
const passport = require('passport');
const boom = require('@hapi/boom');
const cookieParser = require('cookie-parser');
const axios = require('axios');

const { config } = require('./config');

const app = express();

// body parser
app.use(express.json());
app.use(cookieParser());

// BASIC STRATEGY
require('./utils/auth/strategies/basic');

// OAuth Strategy
require('./utils/auth/strategies/oauth');

app.post('/auth/sign-in', async (req, res, next) => {
  passport.authenticate('basic', (error, data) => {
    try {
      if (error || !data) {
        return next(boom.unauthorized());
      }

      req.login(data, { session: false }, async (error) => {
        if (error) next(error);

        const { token, user } = data;

        res.cookie('token', token, {
          httpOnly: !config.dev,
          secure: !config.dev,
        });

        res.status(200).json(user);
      });
    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

app.post('/auth/sign-up', async (req, res, next) => {
  const { body: user } = req;
  try {
    const { data } = await axios({
      url: `${config.apiUrl}/api/auth/sign-up`,
      method: 'post',
      data: user,
    });

    if (!data || status !== 201) {
      next();
    }

    res.status(201).json({ message: 'user created', data: data });
  } catch (error) {
    next(error);
  }
});

app.get('/movies', async (req, res, next) => {});

app.post('/user-movies', async (req, res, next) => {
  const { body: userMovie } = req;
  const { token } = req.cookies;

  try {
    const { data, status } = await axios({
      url: `${config.apiUrl}/api/user-movies`,
      headers: { Authorization: `Bearer ${token}` },
      method: 'post',
      data: userMovie,
    });

    if (status !== 201) {
      next(boom.badImplementation());
    }

    return res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

app.delete('/user-movies/:userMovieId', async (req, res, next) => {
  const { userMovieId } = req.params;
  try {
    const { data, status } = await axios({
      url: `${config.apiUrl}/api/user-movies/${userMovieId}`,
      method: 'delete',
    });

    if (!data || status !== 200) {
      next(boom.badImplementation());
    }

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

app.get(
  '/auth/google-oauth',
  passport.authenticate('google-oauth', {
    scope: ['email', 'profile', 'openid'],
  })
);

app.get(
  '/auth/google-oauth/callback',
  passport.authenticate('google-oauth', { session: false }),
  (req, res, next) => {
    if ((!req.user)) return next(boom.unauthorized());
    const { token, ...user } = req.user;

    res.cookie('token', token, {
      httpOnly: !config.dev,
      secureOnly: !config.dev,
    });
    
    res.status(200).json(user);
  }
);

app.listen(config.port, () => {
  console.log(`Listening http://localhost:${config.port}`);
});
