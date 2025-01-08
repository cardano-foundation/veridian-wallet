import { generateElementId } from "../../utils/idGenerator";
import { CardThemeBaseProps } from "./CardTheme.types";

const CardThemeTwo = ({ className }: CardThemeBaseProps) => {
  const fillId = generateElementId();

  return (
    <svg className={className} width="350" height="200" viewBox="0 0 350 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_225_4972)">
        <rect width="350" height="200" fill={`url(#${fillId})`} />
        <g opacity="0.12">
          <path d="M280.426 202.611C270.944 189.759 261.383 176.907 256.838 161.235C256.525 160.177 256.956 158.923 256.564 157.356C256.055 156.925 255.976 156.964 255.976 156.964C260.913 155.867 265.85 154.77 271.884 153.633C273.412 153.633 273.804 153.751 274.235 153.79C278.192 165.388 282.933 176.555 292.415 184.822C292.846 184.352 292.807 184.274 292.415 184.626C292.65 185.527 293.316 186.076 293.943 186.585C294.061 185.88 294.178 185.214 294.335 184.038C294.335 183.255 294.335 182.941 294.335 182.628C299.233 171.931 305.698 161.666 308.597 150.46C311.536 139.136 310.909 126.912 311.889 114.413C314.827 115.471 319.255 117.038 324.466 118.918C325.72 119.585 326.19 119.898 326.817 120.799C327.875 121.465 328.776 121.583 329.599 121.7C329.56 121.7 329.52 121.583 329.207 122.288C331.871 150.185 324.035 174.086 306.364 195.088C305.58 195.088 305.267 195.088 304.601 195.088C304.248 195.049 303.582 194.813 303.504 194.382C302.759 193.599 302.054 193.246 301.388 192.894C301.662 193.638 301.936 194.382 302.328 195.636C314.004 201.984 325.602 207.822 337.2 214.208C337.2 216.363 337.2 217.931 337.2 219.498C337.2 219.498 337.2 219.498 336.691 219.498C334.967 220.517 333.83 221.575 332.616 222.985C332.576 223.651 332.537 223.925 331.91 224.161C330.735 225.14 330.147 226.198 329.56 227.138C329.56 227.099 329.677 227.099 329.246 226.629C327.522 226.982 326.229 227.844 324.897 228.627C324.897 228.588 324.936 228.51 324.936 228.51C312.986 222.123 301.074 215.736 288.693 209.82C288.262 210.29 288.34 210.369 288.771 209.938C287.909 208.801 286.616 208.096 285.245 206.881C283.599 205.079 282.032 203.864 280.465 202.611H280.426Z" fill="#1F242B" />
          <path d="M332.424 224.201C332.424 223.926 332.464 223.652 333.012 222.947C334.736 221.497 335.951 220.518 337.126 219.499C337.126 219.499 337.126 219.499 337.557 219.264C338.772 217.618 339.516 216.208 340.809 214.797C349.586 207.705 353.073 197.988 355.228 187.879C356.129 183.726 357.266 184.157 360.322 186.038C363.613 192.346 366.434 198.341 369.216 204.884C367.179 210.095 365.18 214.719 363.104 219.852C359.93 224.71 356.874 229.02 353.308 233.252C352.133 233.722 351.427 234.192 350.801 234.741L350.84 234.662C337.675 245.594 323.452 254.723 306.133 256.996C279.725 260.444 255.471 255.507 235.215 236.229C245.48 236.229 254.492 229.294 265.855 234.466C286.268 243.752 306.721 242.146 325.293 228.942C324.823 228.472 324.784 228.55 325.215 229.02C326.939 228.707 328.232 227.884 329.564 227.022C329.564 227.022 329.447 227.022 329.878 226.943C331.014 225.964 331.68 225.024 332.385 224.083L332.424 224.201Z" fill="#343B45" />
          <path d="M326.543 120.296C326.073 119.943 325.642 119.629 324.976 118.924C312.085 110.696 298.724 106.112 283.443 109.286C281.171 109.756 278.506 108.345 276.195 106.7C277.252 102.899 278.154 100.195 279.055 97.531C284.658 88.7935 286.382 89.1853 298.293 90.635C311.38 92.2023 323.683 95.3368 334.81 102.233C356.047 115.359 369.408 134.205 373.679 159.007C374.58 164.14 374.541 169.429 374.345 174.954C373.757 175.268 373.835 175.228 373.718 174.797C372.66 173.661 371.72 172.995 370.583 171.82C365.333 165.981 360.318 160.614 355.146 154.697C354.088 154.031 353.187 153.913 352.325 153.835C352.325 153.874 352.442 153.874 352.912 153.404C347.78 140.67 341.746 128.798 329.443 121.628C329.443 121.628 329.443 121.745 329.364 121.275C328.385 120.648 327.444 120.491 326.543 120.296Z" fill="#343B45" />
          <path d="M207.278 176.594C205.71 144.857 225.419 111.435 254.492 98.7399C251.984 111.082 250.417 122.288 241.248 132.475C219.463 156.69 220.717 189.446 240.151 216.363C232.824 216.363 226.437 216.677 220.09 216.167C218.523 216.05 216.642 213.581 215.741 211.779C210.491 200.926 207.082 189.563 207.238 176.594H207.278Z" fill="#343B45" />
          <path d="M278.626 97.2531C278.156 100.192 277.255 102.895 276.119 106.069C273.846 113.788 271.769 120.997 269.418 129.343C265.422 130.518 259.78 132.203 254.098 133.849C249.788 112.142 260.328 75.3114 290.851 50C305.309 60.6966 315.183 74.8804 323.097 92.9432C310.285 89.6911 297.473 90.6706 291.987 75.8599C291.203 76.1342 290.459 76.4085 289.675 76.6827C285.875 83.4612 282.035 90.2396 278.665 97.2923L278.626 97.2531Z" fill="#1F242B" />
          <path d="M355.302 155.203C360.318 160.57 365.333 165.938 370.544 172.403C371.759 174.049 372.817 174.637 373.835 175.224H373.757C373.992 176.674 373.757 178.477 374.501 179.652C384.649 195.599 390.135 212.761 388.803 233.527C377.753 234.937 366.352 236.426 354.95 237.719C353.97 237.837 352.834 236.426 351.306 235.251C350.836 234.741 350.836 234.82 351.149 235.251C352.246 234.898 352.991 234.154 353.774 233.409C356.87 229.099 359.926 224.789 363.687 219.97C367.449 218.677 370.505 217.893 375.011 216.718C373.012 212.408 371.132 208.411 369.29 204.376C366.43 198.381 363.609 192.386 360.357 185.568C353.774 173.305 343.626 166.213 333.047 159.395C331.166 158.18 329.834 154.811 329.717 152.342C329.599 149.365 331.01 146.308 331.911 142.743C339.003 146.622 345.703 150.227 352.364 153.87C352.364 153.87 352.246 153.87 352.364 154.262C353.422 154.85 354.323 155.007 355.224 155.203H355.302Z" fill="#1F242B" />
          <path d="M279.878 202.649C281.994 203.863 283.561 205.078 285.285 207.311C286.382 208.996 287.323 209.701 288.263 210.407C288.263 210.407 288.224 210.328 288.185 210.289C284.737 213.502 281.798 217.616 277.841 219.888C250.413 235.483 221.654 237.52 191.915 227.215C191.21 226.98 190.426 226.98 189.016 226.784C188.663 209.388 194.266 193.833 203.239 178.787C206.478 192.344 206.817 204.634 204.257 215.657C224.71 222.749 244.379 219.497 263.579 211.19C269.025 208.839 274.079 205.587 279.839 202.727L279.878 202.649Z" fill="#1F242B" />
          <path d="M256.094 156.848C247.043 162.216 237.953 167.623 228.902 172.991C226.551 164.881 229.842 156.026 233.682 147.993C235.484 144.271 241.322 142.038 245.711 140.079C265.889 131.067 286.773 126.326 308.049 131.145C308.049 135.534 307.853 139.491 308.088 143.448C308.362 148.464 305.541 150.07 301.427 149.09C285.441 145.251 270.904 150.344 256.172 156.417C255.937 156.966 256.015 156.888 256.055 156.848H256.094Z" fill="#1F242B" />
          <path d="M274.2 153.32C273.848 153.712 273.417 153.673 272.437 153.399C272.633 153.085 273.417 152.968 274.2 153.32Z" fill="#1F242B" />
          <path d="M293.867 182.789C294.259 182.946 294.298 183.259 293.907 183.965C293.515 184.357 292.77 184.278 292.77 184.278C292.77 184.278 292.81 184.357 292.849 184.396C293.084 183.926 293.28 183.455 293.867 182.789Z" fill="#1F242B" />
          <path d="M303.426 194.349C303.505 194.78 302.839 195.015 302.486 195.054C301.859 194.349 301.585 193.605 301.311 192.86C301.977 193.213 302.682 193.566 303.426 194.349Z" fill="#1F242B" />
          <path d="M292.38 184.628C292.811 184.276 293.555 184.354 293.908 184.433C294.143 185.216 294.026 185.921 293.908 186.588C293.242 186.039 292.615 185.49 292.38 184.628Z" fill="#1F242B" />
          <path d="M326.702 120.842C327.447 120.489 328.348 120.646 329.406 121.273C328.661 121.626 327.76 121.508 326.702 120.842Z" fill="#1F242B" />
          <path d="M306.245 195.087C306.206 195.361 305.658 195.597 304.992 195.479C305.148 195.087 305.462 195.087 306.245 195.087Z" fill="#1F242B" />
        </g>
      </g>
      <defs>
        <linearGradient id={fillId} x1="99.569" y1="76.9231" x2="580.321" y2="77.5587" gradientUnits="userSpaceOnUse">
          <stop stopColor="none" />
          <stop offset="1" stopColor="none" />
        </linearGradient>
        <clipPath id="clip0_225_4972">
          <rect width="350" height="200" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
export { CardThemeTwo };
