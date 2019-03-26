import { assert } from 'chai';
import { Client, Verifier, Agreement } from '../src';

let registrationValue;
let signInValue;
let solvedChallange;
let client;
let verifier;
let challange;
let password;
let agreement;

const algs = ['md5', 'sha1', 'sha256', 'sha384', 'sha512'];
const pBits = [128, 256, 512, 1024, 2048];
const pModes = [
  {
    power: false,
    expectedComparation: 8
  },
  {
    power: true,
    expectedComparation: 12
  }];

pBits.map(async (p) => {
  pModes.map(async (pMode) => {
    describe(`${p}bit - Library test with power ${pMode.power ? 'on' : 'off'}`, () => {
      it(`${p}bit test - Should be able to generate valid agreement with given bit length`, async () => {
        agreement = await Agreement.generateAgreement(p);
        assert(agreement.isValid, 'Invalid agreement');
        assert(agreement.bitLength === p, `Invalid prime size ${agreement.bitLength}. Expected ${p}`);
      });
      algs.map(async (a) => {
        it(`${p}bit - ${a} test - Client should be able generate valid registration value`, () => {
          client = new Client(agreement, pMode.power);
          password = 'password';
          registrationValue = client.getRegistration(password, a);
          assert(
            Math.round(agreement.bitLength / registrationValue.bitLength()) === 1,
            `Unecpected registration value with ${registrationValue.bitLength()} lentgh`
          );
        });

        it(`${p}bit - ${a} test - Client should be able generate valid signin value`, () => {
          signInValue = client.getSignIn();
          assert(
            Math.round(agreement.bitLength / signInValue.bitLength()) === 1,
            `Unecpected sign in value with ${signInValue.bitLength()} lentgh`
          );
        });

        it(`${p}bit - ${a} test - Verifier should be able generate valid challange`, () => {
          verifier = new Verifier(agreement, pMode.power);
          challange = verifier.getChallange();
          assert(
            Math.round(challange.bitLength() / agreement.bitLength) === pMode.expectedComparation,
            `Invalid challange with ${challange.bitLength()} length`
          );
        });

        it(`${p}bit - ${a} test - Client should be able to solve a challange given by verifier`, () => {
          solvedChallange = client.solveChallange(password, challange, a);
          assert(
            Math.floor(solvedChallange.bitLength() / agreement.bitLength) === pMode.expectedComparation,
            `Invalid solved value with ${solvedChallange.bitLength()} length`
          );
        });

        it(`${p}bit - ${a} test - Verifier should be able to verify in the case of right password`, () => {
          const success = verifier.verify(solvedChallange, registrationValue, signInValue);
          assert(success, 'Failed');
        });

        it(`${p}bit - ${a} test - Verification should fail in the case of wrong password`, async () => {
          solvedChallange = client.solveChallange('wrong-password', challange);
          const success = verifier.verify(solvedChallange, registrationValue, signInValue);
          assert(!success, 'Failed');
        });
      });
    });
  });
});