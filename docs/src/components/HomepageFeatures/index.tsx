import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Active learning',
    Svg: require('@site/static/img/active-learning.svg').default,
    description: (
      <>
        Reduce the number of annotations needed to train a model by using active learning.
      </>
    ),
  },
  {
    title: 'Multimodal',
    Svg: require('@site/static/img/multimodal.svg').default,
    description: (
      <>
        Support all types of data, including text, images, and audio.
      </>
    ),
  },
  {
    title: 'Multilingual',
    Svg: require('@site/static/img/multilingual.svg').default,
    description: (
      <>
        Available in multiple languages, including English, Japanese, and French.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
