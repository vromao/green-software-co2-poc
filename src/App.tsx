import { FormEvent, useState } from 'react';
import { co2, hosting } from '@tgwf/co2';
import './App.css';
import { IgreenHostOutput } from './types';

const PER_BYTE_TRACE_DEFAULT_OPTIONS = {
  gridIntensity: {
    device: { country: 'BRA' },
    dataCenter: { country: 'BRA' },
    networks: 442,
  },
};

function App() {
  const [hostIsGreenOutput, setHostIsGreenOutput] = useState<IgreenHostOutput>({
    isGreen: undefined,
  });
  const [dataTransferOutput, setDataTransferOutput] = useState<any>({});
  const [fileUploadOutput, setFileUploadOutput] = useState<any>({
    fileUploadCo2Emissions: 0,
  });

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

      const response = await fetch(endpoint) as any;

      if (response.body) {
        const reader = response.body.getReader();
        let totalBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          totalBytes += value.length;
        }

        const { co2: co2Emissions, green, variables } = defaultModel.perByteTrace(
          totalBytes,
          true,
          options
        );

        setDataTransferOutput({
          co2Emissions,
          isEmissionsGreen: String(green),
          ...variables,
        });
      }

    } catch ({ message: error }: any) {
      const errorMessage = error === 'Failed to fetch' ? 'Failed to fetch normally caused by CORS' : error;
      setDataTransferOutput({
        error: errorMessage,
      });
    }
  };

  const handleFileUploadTest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const defaultModel = new co2({ model: 'swd' });

      const form = event.currentTarget;
      const { elements } = form;
      const [input] = elements;

      const inputHostElement = input as HTMLInputElement;
      const inputFiles = inputHostElement.files;

      const fileSizeBytes = inputFiles ? inputFiles[0].size : 0;

      const { co2: co2Emissions } = defaultModel.perByteTrace(
        fileSizeBytes,
        true,
        PER_BYTE_TRACE_DEFAULT_OPTIONS
      );

      setFileUploadOutput({
        fileUploadCo2Emissions: co2Emissions,
      });
    } catch ({ message: error }: any) {
      setFileUploadOutput({
        error,
      });
    }
  }

  const { isGreen, error: hostIsGreenError } = hostIsGreenOutput;

  const {
    co2Emissions,
    isEmissionsGreen,
    bytes,
    description,
    gridIntensity = {},
    error: dataTransferError
  } = dataTransferOutput;

  const {
    dataCenter,
    description: gridDescription,
    device,
    network,
    production,
  } = gridIntensity;

  const { fileUploadCo2Emissions, error: fileUpadloadError } = fileUploadOutput;

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
        <h2>CO2 Emissions vs data transfer (SWD model)</h2>
        <form onSubmit={handleDataTransferTest}>
          <input type="text" placeholder="Website URL or endpoint" name="endpointUrl" />
          <input
            defaultValue="BRA"
            type="text"
            placeholder="Region"
            name="enpointRegion"
          />
          <button type="submit">Run test</button>
        </form>

        {!dataTransferError ? (
          <div>
            <strong>Results</strong>
            {co2Emissions && (
              <>
                <p><strong>Co2 emissions (in grammes):</strong> {co2Emissions}</p>
                <p><strong>Is this from a green data center?</strong> {isEmissionsGreen}</p>
                <p><strong>Bytes:</strong> {bytes}</p>
                <div>
                  <h4>{description}</h4>
                  <p><strong>Data center:</strong> {dataCenter}</p>
                  <p><strong>Description:</strong> {gridDescription}</p>
                  <p><strong>Device:</strong> {device}</p>
                  <p><strong>Network:</strong> {network}</p>
                  <p><strong>Production:</strong> {production}</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <p>Error: {dataTransferError}</p>
        )}
      </section>

      <hr />

      <section>
        <h2>File upload transfer check (SWD model)</h2>
        <form onSubmit={handleFileUploadTest}>
          <input type="file" />
          <button type="submit">Upload</button>
        </form>

        {!fileUpadloadError ? (
          <p>Result: {!!fileUploadCo2Emissions && `${fileUploadCo2Emissions} (co2 in grammes)`}</p>
        ) : (
          <p>Error: {fileUpadloadError}</p>
        )}
      </section>
    </main>
  );
}

export default App;
