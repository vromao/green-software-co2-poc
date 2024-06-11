import { FormEvent, useState } from 'react';
import { co2, hosting } from '@tgwf/co2';
import './App.css';
import { IgreenHostOutput } from './types';

function App() {
  const [hostIsGreenOutput, setHostIsGreenOutput] = useState<IgreenHostOutput>({
    isGreen: undefined,
  });
  const [dataTransferOutput, setDataTransferOutput] = useState<any>({});

  const handleGreenHostTest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const form = event.currentTarget;
      const { elements } = form;
      const [input] = elements;

      const inputHostElement = input as HTMLInputElement;
      const host: string = inputHostElement.value;

      const adressBarRegex = /\//g;
      const hasInvalidChars = adressBarRegex.test(host);

      if (!host) {
        throw new Error('Please, fill the input above and try again');
      } else if (hasInvalidChars) {
        throw new Error(
          '"/" char or "https://" is not valid. Valid examples: g1.globo.com'
        );
      }

      const isGreen = await hosting.check(host);

      setHostIsGreenOutput({
        isGreen,
      });
    } catch ({ message: error }: any) {
      setHostIsGreenOutput({
        error,
      });
    }
  };

  const handleDataTransferTest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const defaultModel = new co2({ model: 'swd' });
    const oneByteModel = new co2({ model: '1byte' });

    const form = event.currentTarget;
    const { elements } = form;
    const [endpointInput, regionInput] = elements;

    const endpointUrlElement = endpointInput as HTMLInputElement;
    const endpoint: string = endpointUrlElement.value;

    const regionUrlElement = regionInput as HTMLInputElement;
    const region: string = regionUrlElement.value;

    try {
      const options = {
        gridIntensity: {
          device: { country: region }, // Here we have set the grid intensity at the device location using a number.
          dataCenter: { country: region }, // Here we have set the data center grid intensity using a country code.
          networks: 442, // default value for network
        },
      };

      const resp = (await fetch(endpoint, {
        method: 'GET',
        mode: 'no-cors',
      })) as any;

      const reader = resp.body.getReader();
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        totalBytes += value.length;
      }

      const emissionsResult = defaultModel.perByteTrace(
        totalBytes,
        true,
        options
      );

      setDataTransferOutput({
        emissionsResult,
      });
    } catch ({ message: error }: any) {
      console.info('error', error);
      setDataTransferOutput({
        error,
      });
    }
  };

  const { isGreen, error: hostIsGreenError } = hostIsGreenOutput;
  const { emissionsResult, error: dataTransferError } = dataTransferOutput;

  return (
    <main>
      <h1>Green Software PoC</h1>
      <section>
        <h2>Is this host green?</h2>
        <form onSubmit={handleGreenHostTest}>
          <input type="text" placeholder="g1.globo.com" name="host" />
          <button type="submit">Run test</button>
        </form>

        {!hostIsGreenError ? (
          <p>Result: {isGreen && String(isGreen)}</p>
        ) : (
          <p>Error: {hostIsGreenError}</p>
        )}
      </section>

      <hr />

      <section>
        <h2>CO2 Emissions vs data transfer</h2>
        <p></p>
        <form onSubmit={handleDataTransferTest}>
          <input type="text" placeholder="Endpoint URL" name="endpointUrl" />
          <input
            defaultValue="BRA"
            type="text"
            placeholder="Region"
            name="enpointRegion"
          />
          <button type="submit">Run test</button>
        </form>

        {!dataTransferError ? (
          <p>Result: {emissionsResult && emissionsResult}</p>
        ) : (
          <p>Error: {dataTransferError}</p>
        )}
      </section>
    </main>
  );
}

export default App;
