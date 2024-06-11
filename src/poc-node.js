import chalk from 'chalk';
import { co2 } from '@tgwf/co2';

const DATA_SIZE = 1000000; // 1MB

const defaultModel = new co2();
const oneByteModel = new co2({ model: '1byte' });
let emissions;

const options = {
  gridIntensity: {
    device: 565.629, // Here we have set the grid intensity at the device location using a number.
    dataCenter: { country: 'TWN' }, // Here we have set the data center grid intensity using a country code.
    networks: 442,
  },
};

function main() {
  console.log('========== CO2 Emissions for 1MB of data transfer ==========\n');

  console.group();
  console.log('Using Sustainable Web Design (SWD) model');
  console.group();
  emissions = defaultModel.perByte(DATA_SIZE);
  console.log(
    `Emissions for 1MB of data: ${chalk.bold.magenta(emissions.toFixed(2))} g`
  );
  console.groupEnd();
  console.groupEnd();

  console.log();
  console.group();
  console.log('Using 1Byte model');
  console.group();
  emissions = oneByteModel.perByte(DATA_SIZE);
  console.log(
    `Emissions for 1MB of data: ${chalk.bold.magenta(emissions.toFixed(2))} g`
  );
  console.groupEnd();
  console.groupEnd();

  console.log();
  console.group();
  console.log('Using Sustainable Web Design (SWD) model');
  console.group();
  emissions = defaultModel.perByteTrace(DATA_SIZE, true, options);
  console.log(
    `Emissions for 1MB of data: ${chalk.bold.magenta(
      emissions.co2.toFixed(2)
    )} g`
  );
  console.log(`Green host: ${chalk.bold.green(emissions.green)} g`);
  console.groupEnd();
  console.groupEnd();
}

main();
