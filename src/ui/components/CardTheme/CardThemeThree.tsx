import { generateElementId } from "../../utils/idGenerator";
import { CardThemeBaseProps } from "./CardTheme.types";

const CardThemeThree = ({ className }: CardThemeBaseProps) => {
  const fillId = generateElementId();
  
  return (
    <svg className={className} width="350" height="200" viewBox="0 0 350 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_225_4981)">
        <rect width="350" height="200" fill={`url(#${fillId})`} />
        <g opacity="0.12">
          <path fillRule="evenodd" clipRule="evenodd" d="M7.29977 -64.0252C-8.18249 -48.1368 -21.1022 -30.3753 -31.6684 -10.7396C-32.0188 -10.0654 -32.367 -9.40527 -32.711 -8.75323C-33.403 -7.44172 -34.0777 -6.16275 -34.7181 -4.86674C-52.848 31.8274 -61.0073 70.6089 -59.0672 111.504C-58.059 132.758 -54.2325 153.499 -47.4998 173.673C-33.2586 216.346 -8.94624 252.29 25.8475 280.766C83.0244 327.562 148.409 343.901 220.814 330.395C272.553 320.743 316.289 295.736 351.032 256.145C397.122 203.623 415.871 142.111 408.53 72.7321C405.581 44.8643 397.431 18.3937 384.575 -6.52602C360.921 -52.374 326.141 -87.1761 279.979 -110.267C245.636 -127.445 209.076 -135.212 170.679 -134.416C145.724 -133.898 121.454 -129.599 97.8822 -121.427C63.1929 -109.401 32.9435 -90.3414 7.29977 -64.0252ZM215.996 165.882C216.063 153.973 219.828 143.214 226.714 133.394C230.301 128.312 234.412 123.868 239.427 120.391C256.802 108.345 275.008 106.605 293.879 116.604C300.951 120.351 305.638 126.221 306.872 134.339C307.594 139.084 307.114 143.746 303.76 147.523C298.4 153.559 288.503 153.072 283.583 146.68C282.677 145.502 281.968 144.207 281.26 142.912C280.584 141.676 279.908 140.44 279.06 139.306C276.508 135.892 273.267 133.695 268.952 133.254C267.328 133.089 265.716 133.26 264.108 133.431C263.896 133.454 263.684 133.477 263.471 133.498C257.141 134.149 251.221 135.937 246.609 140.568C237.506 149.709 233.709 160.871 236.142 173.45C238.53 185.801 245.031 196.271 254.108 204.944C267.758 217.986 284.15 223.621 302.959 222.134C321.995 220.629 338.685 213.59 352.693 200.549C363.459 190.526 371.695 178.589 378.386 165.552C385.635 151.425 389.74 136.333 392.208 120.717C395.152 102.088 395.977 83.4031 393.93 64.6328C391.398 41.4179 384.697 19.4545 373.947 -1.27287C363.718 -20.9939 350.626 -38.6436 335.041 -54.4225C324.267 -65.3297 312.072 -74.4991 299.152 -82.7227C271.847 -100.102 242.696 -112.863 210.567 -118.181C204.05 -119.26 197.512 -120.199 190.898 -120.439C190.801 -120.442 190.696 -120.451 190.587 -120.461C190.061 -120.506 189.445 -120.56 189.246 -120.026C188.981 -119.317 189.673 -118.889 190.2 -118.563C190.229 -118.545 190.257 -118.528 190.284 -118.511C190.745 -118.223 191.206 -117.933 191.667 -117.643C193.603 -116.424 195.541 -115.204 197.555 -114.13C209.798 -107.603 220.027 -98.7188 228.629 -87.8861C254.361 -55.48 252.619 -16.7065 232.504 13.1586C216.653 36.6927 191.697 44.2321 166.956 36.8406C144.011 29.9856 129.601 10.0703 130.525 -13.0076C130.892 -22.1813 135.233 -28.9163 143.417 -33.0965C151.82 -37.3882 160.872 -32.8399 162.569 -23.5173C163.342 -19.2663 161.732 -15.6544 159.408 -12.2899C155.031 -5.95244 155.156 0.402252 159.434 6.64717C166.679 17.2241 177.126 20.8424 189.419 19.6981C198.808 18.8242 206.398 14.3643 212.513 7.16267C223.812 -6.1441 230.041 -21.203 228.49 -38.8819C226.649 -59.8772 217.53 -77.0423 200.388 -89.4802C182.876 -102.186 162.907 -108.005 141.474 -108.937C123.675 -109.711 106.563 -106.164 90.0715 -99.6205C57.8089 -86.8198 30.0958 -67.321 6.19675 -42.2698C-13.7237 -21.389 -28.0265 2.77307 -36.6518 30.3573C-46.2049 60.9089 -49.3731 92.0007 -45.2764 123.781C-42.0778 148.593 -34.7796 172.217 -24.4582 194.95C-24.1155 195.705 -23.6812 196.423 -23.2359 197.124C-23.1852 197.204 -23.1372 197.295 -23.088 197.389C-22.8938 197.759 -22.6811 198.163 -22.2061 198.04C-21.7834 197.931 -21.6994 197.48 -21.6213 197.062C-21.6023 196.96 -21.5836 196.86 -21.5605 196.767C-21.2066 195.347 -21.2792 193.896 -21.3525 192.457C-22.0617 178.548 -20.426 164.998 -15.4798 151.891C-9.62082 136.364 -0.933292 122.791 12.0974 112.352C30.8536 97.325 52.4404 91.7899 76.0991 94.6584C93.2048 96.7324 106.983 104.871 116.361 119.559C123.771 131.165 128.165 143.77 126.16 157.774C123.682 175.088 114.809 188.148 99.0695 196.124C90.9669 200.229 82.9959 199.248 75.5643 194.229C69.3377 190.023 68.0714 182.229 72.3391 176.051C75.5761 171.365 80.2089 170.108 85.5677 170.307C91.6722 170.533 97.2868 169.291 100.877 163.768C104.858 157.646 106.806 150.856 105.316 143.617C102.363 129.266 93.5504 119.795 79.7442 115.321C69.3423 111.951 58.6783 112.428 48.1847 115.243C32.4515 119.464 19.1971 127.58 10.5512 141.678C-1.14946 160.758 -5.01503 181.422 0.159206 203.405C4.27767 220.902 12.7895 236.279 23.7876 250.337C35.7187 265.587 50.3675 277.825 66.4704 288.417C89.6627 303.671 114.744 314.28 142.146 319.176C160.46 322.449 178.894 322.867 197.395 321.397C217.109 319.829 236.275 315.701 254.68 308.433C298.389 291.172 332.46 261.964 359.144 223.688C359.207 223.598 359.283 223.505 359.362 223.41C359.714 222.982 360.111 222.5 359.526 221.965C359.001 221.485 358.489 221.829 358.021 222.145C357.921 222.212 357.824 222.277 357.729 222.333C356.265 223.196 354.807 224.069 353.35 224.942C351.283 226.18 349.217 227.418 347.133 228.626C329.761 238.697 311.101 243.43 291.066 241.061C261.701 237.589 239.477 222.817 224.508 197.35C218.839 187.703 215.932 177.127 215.996 165.882Z" fill="#1F242B" />
          <path d="M194.684 102.43C189.25 104.386 184.02 102.013 181.6 96.5967C179.299 91.4493 181.105 85.9376 185.899 83.26C189.439 81.2825 193.379 80.8854 197.259 80.2901C208.496 78.5661 219.742 76.9084 230.987 75.2425C231.502 75.1662 232.051 74.9221 232.751 75.3517C230.203 77.1601 227.729 78.9026 225.269 80.6648C216.973 86.608 208.479 92.2798 200.56 98.7417C198.797 100.18 196.872 101.403 194.684 102.43Z" fill="#343B45" />
          <path d="M185.16 119.067C185.02 121.49 183.98 123.488 183.172 125.542C178.465 137.521 173.716 149.484 168.976 161.45C168.796 161.902 168.562 162.333 167.993 162.736C167.993 160.564 168.135 158.381 167.967 156.223C167.341 148.144 165.959 140.155 165.02 132.112C164.485 127.539 163.988 122.969 164.131 118.345C164.356 111.076 167.948 107.111 174.284 107.144C180.553 107.176 185.753 112.722 185.16 119.067Z" fill="#343B45" />
          <path d="M124.875 63.3635C132.536 66.4705 140.08 69.5485 147.609 72.6616C152.065 74.5044 156.509 76.3792 160.94 78.2843C163.813 79.52 166.465 81.1289 168.65 83.4033C172.68 87.597 172.451 94.0716 168.153 98.17C163.797 102.323 157.23 102.23 153.258 97.9306C152.281 96.8732 151.301 95.7966 150.481 94.6187C143.14 84.0758 134.306 74.7754 125.959 65.0705C125.597 64.6506 125.254 64.2154 124.847 63.6905C124.779 63.5123 124.765 63.4308 124.875 63.3635Z" fill="#1F242B" />
          <path d="M124.843 63.5397C124.709 63.4558 124.711 63.354 124.951 63.3562C124.998 63.3776 124.895 63.4858 124.843 63.5397Z" fill="#1F242B" />
          <path fillRule="evenodd" clipRule="evenodd" d="M172.417 50.286C155.757 47.2204 142.483 38.4005 131.768 25.309C128.852 21.7228 126.191 18.0927 123.963 14.1786C117.526 2.87122 116.691 -8.82181 121.804 -20.8426C124.28 -26.6652 127.659 -31.9242 132.02 -36.5289C137.399 -42.2091 143.784 -46.1132 151.585 -47.4334C155.891 -48.162 159.598 -46.9324 162.635 -43.7741C164.229 -42.1172 165.401 -40.17 166.445 -38.1387C166.907 -37.2414 167.348 -36.3337 167.79 -35.4259C168.781 -33.3878 169.773 -31.3497 170.987 -29.4305C174.374 -24.0742 181.715 -23.3983 186.007 -28.0798C188.804 -31.1311 189.281 -34.9233 189.013 -38.8318C188.514 -46.0942 184.976 -51.8658 179.492 -56.3265C167.564 -66.0294 154.181 -67.2504 140.356 -61.4592C128.098 -56.3248 118.63 -47.5719 111.787 -36.1391C104.858 -24.5623 102.432 -11.9774 103.424 1.42544C104.292 13.1615 108.447 23.4662 116.352 32.1303C122.647 39.0289 129.604 45.236 137.196 50.7197C152.431 61.724 169.232 67.2744 188.154 65.4736C203.139 64.0474 218.073 62.1312 232.692 58.4999C245.901 55.2187 259.136 54.2554 272.434 57.176C306.991 64.7649 331.426 84.696 344.522 117.751C349.836 131.163 350.817 145.098 345.259 158.735C337.431 177.943 322.41 188.495 302.471 192.375C295.244 193.781 288.185 192.391 281.669 188.875C276.263 185.957 272.875 181.439 271.921 175.329C271.333 171.559 271.801 167.811 272.854 164.128C274.244 159.269 273.009 154.983 269.632 151.353C266.788 148.296 263.296 146.539 259.027 147.643C252.971 149.209 248.352 155.437 248.493 161.685C248.566 164.959 248.88 168.225 249.472 171.451C251.277 181.269 255.437 189.813 263.35 196.162C271.992 203.096 281.952 206.88 292.961 207.839C311.556 209.46 327.669 203.803 341.256 191.037C350.176 182.655 356.924 172.639 362.645 161.902C373.732 141.095 378.6 118.697 379.336 95.3052C379.83 79.6147 378.77 64.0136 375.776 48.5811C368.639 11.7944 351.572 -19.796 325.816 -46.8491C314.813 -58.4069 302.783 -68.6582 288.981 -76.7818C275.653 -84.6263 261.556 -90.8619 247.456 -97.099C246.379 -97.5753 245.302 -98.0515 244.226 -98.5285C244.167 -98.5546 244.107 -98.5828 244.046 -98.6113C243.552 -98.8418 243.002 -99.0988 242.542 -98.5612C242.13 -98.0789 242.378 -97.5886 242.611 -97.1275C242.657 -97.0368 242.702 -96.9473 242.742 -96.8593C243.381 -95.4379 244.032 -94.022 244.684 -92.6062C245.912 -89.9371 247.141 -87.2681 248.283 -84.5627C254.103 -70.7795 257.563 -56.4401 258.097 -41.4536C258.67 -25.3723 255.868 -9.8433 250.282 5.2122C245.77 17.3718 238.856 27.91 228.792 36.1724C212.259 49.7466 193.289 54.1266 172.417 50.286ZM272.409 -64.622C273.993 -55.2343 274.661 -45.7844 274.407 -36.1058C274.372 -35.5193 274.341 -34.9445 274.31 -34.3785C274.226 -32.864 274.147 -31.4119 274.023 -29.9636C272.197 -8.66222 265.212 10.8248 253.417 28.624C250.748 32.6531 247.915 36.5594 244.886 40.3254C244.836 40.3876 244.779 40.4508 244.72 40.5153C244.467 40.7943 244.19 41.0993 244.377 41.4677C244.565 41.8384 244.913 41.7581 245.25 41.6801C245.366 41.6534 245.48 41.627 245.586 41.619C245.973 41.5901 246.358 41.5286 246.741 41.4656C259.566 39.3596 272.092 40.6919 284.318 44.9125C297.956 49.6204 310.11 57.0297 321.402 65.8822C339.125 79.7778 351.593 97.3173 357.862 119.091C357.928 119.321 357.972 119.596 358.018 119.878C358.158 120.754 358.311 121.707 359.183 121.648C360.29 121.572 360.415 120.314 360.519 119.275C360.537 119.093 360.555 118.917 360.577 118.756C360.872 116.589 361.082 114.411 361.291 112.232C361.379 111.317 361.467 110.402 361.561 109.487C362.666 98.7806 363.762 88.1005 363.152 77.2794C362.096 58.5397 358.215 40.4628 351.365 23.013C343.796 3.73477 333.119 -13.7293 320.314 -29.9418C313.273 -38.8554 305.658 -47.2049 296.536 -54.062C289.765 -59.1521 282.623 -63.6111 274.602 -66.4924C272.327 -67.3098 272.007 -67.0078 272.409 -64.622Z" fill="#343B45" />
          <path fillRule="evenodd" clipRule="evenodd" d="M43.9502 130.205C38.5304 133.202 33.554 136.81 29.1234 141.332C26.9392 143.485 24.9938 145.698 23.3451 148.139C11.65 165.455 9.16983 184.216 15.5713 203.914C22.8354 226.266 35.9393 244.944 53.2399 260.733C66.8187 273.125 82.4096 282.444 98.8897 290.366C120.822 300.908 143.844 307.574 168.176 309.268C195.255 311.154 221.542 307.248 247.004 297.874C271.559 288.833 293.351 275.1 313.44 258.509C313.481 258.475 313.525 258.441 313.569 258.407C313.827 258.21 314.104 257.999 314.063 257.521C311.861 256.81 309.563 256.657 307.272 256.504C306.925 256.481 306.578 256.457 306.231 256.432C295.439 255.65 284.896 253.639 274.642 250.161C255.469 243.659 239.221 232.653 225.278 218.099C218.782 211.318 213.252 203.869 209.307 195.293C203.364 182.374 202.379 168.905 204.833 155.074C208.288 135.595 218.113 120.335 235.136 109.984C245.555 103.648 257.006 100.32 269.035 98.8156C277.2 97.7944 285.098 98.6141 292.561 102.321C309.46 110.714 319.585 130.256 316.682 148.873C315.551 156.13 311.916 160.16 305.401 161.312C303.871 161.582 302.315 161.638 300.756 161.567C299.638 161.516 298.52 161.44 297.403 161.363C294.865 161.19 292.327 161.017 289.779 161.139C285.992 161.322 283.234 163.074 281.77 166.636C280.23 170.379 280.423 173.893 283.279 177.014C285.698 179.657 288.595 181.557 292.055 182.509C302.63 185.421 312.118 182.914 320.074 175.752C329.107 167.621 332.726 156.743 333.334 144.907C333.955 132.837 330.323 121.757 324.107 111.54C311.675 91.1029 288.795 77.4568 260.988 83.5474C251.979 85.5206 243.505 88.9552 235.252 92.9639C218.498 101.102 205.575 113.149 197.975 130.369C192.551 142.661 187.793 155.218 184.141 168.173C177.316 192.386 163.703 211.465 141.934 224.578C119.169 238.291 95.1187 243.071 69.1249 236.094C58.6604 233.285 49.1684 228.685 41.988 220.416C27.8658 204.154 25.1517 185.607 31.9038 165.466C33.7365 159.999 36.5098 154.984 40.8426 151.024C47.1008 145.304 54.2449 143.725 62.2702 146.68C65.9217 148.025 68.9593 150.321 71.8722 152.859C76.4742 156.868 81.7178 157.49 87.2491 155.137C91.4036 153.369 93.7478 149.574 93.1357 145.289C92.2961 139.41 89.6432 134.562 84.0883 131.747C81.5109 130.442 78.8669 129.287 76.1402 128.329C65.1496 124.468 54.3704 124.445 43.9502 130.205ZM183.266 205.863C175.65 217.502 165.305 226.162 153.371 233.271C146.893 237.078 140.311 240.411 133.469 243.215C115.366 250.634 96.6749 253.481 77.2273 250.405C73.771 249.858 70.3574 249.117 66.9683 248.251C66.8478 248.22 66.7213 248.178 66.5925 248.135C66.0635 247.957 65.4938 247.765 65.1261 248.315C64.6957 248.959 65.1583 249.416 65.5864 249.84C65.6876 249.94 65.7869 250.038 65.872 250.136C66.3412 250.678 66.8802 251.167 67.4298 251.63C98.5499 277.851 134.632 291.19 175.121 292.962C189.131 293.575 203.087 292.721 216.956 290.639C230.368 288.624 243.364 285.18 255.502 278.963C261.043 276.125 266.423 273.01 271.086 268.815C272.379 267.653 272.356 267.628 270.699 266.958C269.931 266.647 269.162 266.34 268.392 266.033C266.429 265.251 264.466 264.468 262.531 263.623C247.208 256.936 233.452 247.905 221.682 235.983C208.897 223.034 199.61 207.823 192.902 190.974C192.827 190.786 192.76 190.593 192.693 190.398C192.495 189.825 192.295 189.242 191.871 188.763C191.387 189.067 191.268 189.494 191.154 189.902C191.121 190.021 191.088 190.139 191.047 190.251C189.029 195.742 186.472 200.962 183.266 205.863Z" fill="#343B45" />
          <path fillRule="evenodd" clipRule="evenodd" d="M182.298 -84.3705C171.699 -90.1511 160.14 -92.3744 148.023 -92.8241C144.596 -93.0408 141.326 -92.9846 138.049 -92.8913C117.974 -92.3191 98.8359 -87.752 80.5227 -79.5716C64.4952 -72.4122 50.0127 -62.7907 36.2832 -51.9552C23.4599 -41.8349 11.6197 -30.7262 2.12761 -17.3409C-6.70724 -4.88237 -13.7477 8.59016 -19.6914 22.6317C-29.7926 46.4949 -35.1584 71.332 -34.7137 97.3231C-34.5447 107.201 -33.494 117.006 -32.4434 126.81C-31.9629 131.295 -31.4823 135.78 -31.0861 140.272C-31.0805 140.336 -31.0768 140.401 -31.0731 140.467C-31.0493 140.895 -31.0244 141.339 -30.4475 141.476C-29.7817 141.634 -29.4427 141.177 -29.1214 140.745L-29.0971 140.712C-28.5412 139.965 -27.9823 139.221 -27.4233 138.476C-25.8832 136.424 -24.343 134.371 -22.8669 132.274C-18.9281 126.677 -14.6353 121.376 -9.8253 116.509C6.22178 100.271 25.6299 90.076 47.6526 84.5762C58.0909 81.9694 68.6417 80.8195 79.3393 82.3657C99.7321 85.3131 115.682 95.901 126.36 113.047C140.775 136.193 140.634 160.628 128.485 184.799C120.848 199.991 107.828 207.209 90.9504 207.458C79.7987 207.622 69.8509 204.214 61.5194 196.647C57.9561 193.411 55.9176 189.485 57.026 184.47C57.4984 182.332 58.422 180.376 59.5699 178.527C60.3568 177.26 61.1539 175.999 61.951 174.739C63.1116 172.903 64.2722 171.067 65.401 169.212C67.4942 165.773 67.4225 162.355 64.975 159.108C62.3869 155.675 59.0959 153.964 54.6836 155.062C50.4418 156.118 46.9116 158.338 44.1007 161.626C37.5634 169.271 35.6717 178.206 37.8369 187.818C40.2221 198.408 46.4093 206.787 55.2984 212.751C72.3237 224.174 90.9037 226.604 110.322 220.154C126.897 214.648 138.873 203.761 145.386 187.37C148.593 179.3 150.544 170.858 151.666 162.233C154.301 141.983 150.467 123.144 139.487 105.836C134.74 98.3534 128.835 91.8172 122.93 85.2807C122.323 84.6091 121.717 83.9376 121.111 83.265C119.538 81.5178 117.937 79.793 116.336 78.068C111.85 73.2361 107.363 68.4026 103.494 63.0686C83.0084 34.8267 79.2155 4.1056 90.869 -28.5171C96.0347 -42.9777 104.445 -55.4975 116.546 -65.1688C126.627 -73.2249 138.267 -77.0338 151.227 -76.5302C159.012 -76.2277 166.296 -74.0176 173.252 -70.6068C184.277 -65.2012 192.677 -57.265 197.281 -45.675C199.363 -40.4353 199.659 -35.0697 198.054 -29.6823C195.955 -22.6384 191.593 -17.6209 184.074 -16.6078C177.961 -15.7843 173.539 -11.0807 172.268 -5.89502C171.23 -1.65861 171.785 2.20213 175.412 5.09676C179.483 8.3465 187.707 8.89958 192.197 6.2627C195.409 4.37618 198.466 2.25967 201.29 -0.178604C208.463 -6.37089 213.49 -13.8627 214.725 -23.4263C215.896 -32.5045 215.308 -41.5009 212.378 -50.2392C207.15 -65.8299 196.428 -76.6637 182.298 -84.3705ZM101.216 -70.3864L76.7479 -59.4621C14.9101 -31.8531 -22.8989 31.6454 -17.7049 99.1672L-11.561 93.7509C16.229 69.2518 54.4338 60.2818 90.2232 69.8534C62.3535 29.7289 64.1395 -23.9345 94.6155 -62.1171L101.216 -70.3864Z" fill="#343B45" />
        </g>
      </g>
      <defs>
        <linearGradient id={fillId} x1="99.569" y1="76.9231" x2="580.321" y2="77.5587" gradientUnits="userSpaceOnUse">
          <stop stopColor="none" />
          <stop offset="1" stopColor="none" />
        </linearGradient>
        <clipPath id="clip0_225_4981">
          <rect width="350" height="200" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
export { CardThemeThree };
