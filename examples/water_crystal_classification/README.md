# Water Crystal Model

Classification and segmentation of water crystals with deep-learning and active learning

## Datasets

- [5K EPP Water Crystal Dataset](https://ieee-dataport.org/documents/5k-epp-water-crystal-dataset): The 5K EPP Dataset includes 5007 photos of water crystaks classified in 13 categories. This dataset was created under the leaderhip of Prof. Masaru Emoto.

## Installation

Create a virtual environment with the following command:

```bash
python -m venv .venv
source .venv/bin/activate
```

You can install the required packages with the following command:

```bash
pip install -r requirements.txt
```

You need to build the dataset. First copy the dataset in the `epp_dataset/data` folder. It must be include a file called `5k_epp_dataset.csv` with `image_name` and `label` columns and the images in the `images` folder. Then you can run the following command:

```bash
tdfs build ./datasets/epp_dataset
```

## Author

Made by [Mathis Boultoureau](https://github.com/mboultoureau)