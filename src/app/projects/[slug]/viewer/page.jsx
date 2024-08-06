import dynamic from "next/dynamic";

const ImageSegmentation = dynamic(() => import("@/app/_components/task/image-segmentation/image-segmentation"),
  {
    ssr: false,
  },
);

export default function MyCustomViewer() {
  return (
    <>
      <ImageSegmentation />
    </>
  );
};