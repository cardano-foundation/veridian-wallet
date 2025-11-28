declare module "*.jpg";
declare module "*.png";
declare module "*.svg";
declare module "*.gif";
declare module "*.yaml" {
  const data: unknown;
  export default data;
}
