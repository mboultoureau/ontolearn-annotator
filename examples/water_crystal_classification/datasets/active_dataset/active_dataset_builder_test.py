"""active_dataset dataset."""

import active_dataset_builder
import tensorflow_datasets as tfds

class EppDatasetTest(tfds.testing.DatasetBuilderTestCase):
  """Tests for active_dataset dataset."""
  # TODO(active_dataset):
  DATASET_CLASS = active_dataset_builder.Builder
  SPLITS = {
      'train': 4014,  # Number of fake train example
      'test': 501,  # Number of fake test example
      'validation': 503,  # Number of fake validation example
  }

  # If you are calling `download/download_and_extract` with a dict, like:
  #   dl_manager.download({'some_key': 'http://a.org/out.txt', ...})
  # then the tests needs to provide the fake output paths relative to the
  # fake data directory
  # DL_EXTRACT_RESULT = {'some_key': 'output_file1.txt', ...}


if __name__ == '__main__':
  tfds.testing.test_main()
