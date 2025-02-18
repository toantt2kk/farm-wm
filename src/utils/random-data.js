import { faker } from "@faker-js/faker";
import _ from "lodash";

const generateRandomName = () => {
  const adjectives = ["Fast", "Brave", "Clever", "Fierce"];
  const nouns = ["Tiger", "Wolf", "Dragon", "Lion"];
  const specialChars = ["_", ".", "-", ""];

  const randomAdjective = _.sample(adjectives);
  const randomNoun = _.sample(nouns);
  const randomNumber = _.random(10, 999);
  const randomChar = _.sample(specialChars);

  return `${randomAdjective}${randomChar}${randomNoun}${randomNumber}`;
};

const generateRandomNumber = (min = 0, max = 100) => {
  return _.random(min, max);
};

const generateRandomString = (length = 8) => {
  return _.times(length, () =>
    _.sample("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
  ).join("");
};

const generatePassword = () => {
  const length = _.random(8, 12);
  const chars = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    number: "0123456789",
    special: "!@#$%^&*()",
  };

  const allChars = chars.upper + chars.lower + chars.number + chars.special;
  let password = [
    _.sample(chars.upper),
    _.sample(chars.lower),
    _.sample(chars.number),
    _.sample(chars.special),
  ];

  while (password.length < length) {
    password.push(_.sample(allChars));
  }

  return _.shuffle(password).join("");
};

const generatePhone = () => {
  return faker.phone.number({
    style: "national",
  });
};

const generateEmail = (username, userstate, domain) => {
  const firstName = faker.name.firstName();
  const email = `${firstName}${generateRandomNumber(
    0,
    1000
  )}.${username}${userstate}@${domain}.com`;
  return {
    email,
    firstName,
    lastName: username,
    domain,
    password: generatePassword(),
  };
};

export {
  generateEmail,
  generatePassword,
  generatePhone,
  generateRandomName,
  generateRandomNumber,
  generateRandomString,
};
