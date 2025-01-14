import React, { memo, FC } from "react";

type Props = {
  className?: string;
  altText?: string;
}

export const UploadedImage: FC<Props> = memo((props) => {
  const { className, altText = "Uploaded Image" } = props;

  return (
    <img
      className={className}
      src="/images/upload.png"
      alt={altText}
    />
  );
});

export const favoriteImage: FC<Props> = memo((props) => {
    const { className, altText = "Uploaded Image" } = props;
  
    return (
      <img
        className={className}
        src="/images/favorite.png"
        alt={altText}
      />
    );
  });

  export const chatImage: FC<Props> = memo((props) => {
    const { className, altText = "Uploaded Image" } = props;
  
    return (
      <img
        className={className}
        src="/images/chat_bubble.png"
        alt={altText}
      />
    );
  });