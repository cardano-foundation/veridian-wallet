import {
  Badge as BadgeFull,
  BadgeOutlined,
  Group as GroupFull,
  GroupOutlined,
  Menu as MenuIcon,
  Notifications as NotificationsFull,
  NotificationsOutlined,
  Settings as SettingsFull,
  SettingsOutlined,
  SwapHorizontalCircle,
  SwapHorizontalCircleOutlined,
  CheckCircle,
  Logout,
} from "@mui/icons-material";
import {
  AppBar,
  Badge,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  MenuItem,
  Toolbar,
  Typography,
  Chip,
  Tooltip,
} from "@mui/material";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo.svg";
import { RoutePath } from "../../const/route";
import { i18n } from "../../i18n";
import { SwitchAccount } from "../SwitchAccount";
import { DrawerContent } from "./components/DrawerContent";
import { useKERIAuth } from "../AuthContext";
import "./NavBar.scss";
import { isActivePath } from "./helper";
import { useAppSelector } from "../../store/hooks";
import { getRoleView } from "../../store/reducers";
import { RoleIndex } from "./constants/roles";

interface Props {
  window?: () => Window;
}

const drawerWidth = 240;

const menuItems = [
  // TODO: Removing until Overview is ready to be implemented
  // {
  //   key: "overview",
  //   label: i18n.t("navbar.overview"),
  //   path: "/",
  //   icons: [<DashboardFull />, <DashboardOutlined />],
  // },
  {
    key: "connections",
    label: i18n.t("navbar.connections"),
    path: RoutePath.Connections,
    icons: [<GroupFull />, <GroupOutlined />],
  },
  {
    key: "credentials",
    label: i18n.t("navbar.credentials"),
    path: RoutePath.Credentials,
    icons: [<BadgeFull />, <BadgeOutlined />],
  },
  {
    key: "requestPresentation",
    label: i18n.t("navbar.requestPresentation"),
    path: RoutePath.RequestPresentation,
    icons: [<SwapHorizontalCircle />, <SwapHorizontalCircleOutlined />],
  },
];

const getIcon = (icons: React.ReactElement[], isActive: boolean) =>
  isActive ? icons[0] : icons[1];

const NavBar = ({ window }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleViewIndex = useAppSelector(getRoleView) as RoleIndex;
  const { isAuthorized, aid, logout } = useKERIAuth();

  const handleLogout = () => {
    logout();
    navigate(RoutePath.Credentials); // Will show auth prompt
  };

  const displayMenuItems = menuItems.filter((item) =>
    roleViewIndex !== RoleIndex.ISSUER
      ? item.key !== "credentials"
      : item.key !== "requestPresentation"
  );

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <AppBar
      id="navBar"
      position="static"
      sx={{ boxShadow: 0, backgroundColor: "background.default" }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box
            className="nav-tablet"
            sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}
          >
            <IconButton
              color="inherit"
              disableRipple
              aria-label="open drawer menu"
              edge="start"
              className="menu-button"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              <MenuIcon className="menu-icon" />
              <Typography>{i18n.t("navbar.menu")}</Typography>
            </IconButton>
            <Button
              component={Link}
              to={"/"}
              className="logo-button"
              disableRipple
            >
              <img
                className="header-logo"
                alt="veridian-logo"
                src={Logo}
              />
            </Button>
          </Box>
          <Box
            component="nav"
            sx={{ width: { md: drawerWidth }, display: { md: "none" } }}
            aria-label="mobile menu"
          >
            <Drawer
              container={container}
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                display: { xs: "block", sm: "block", md: "none" },
                "& .MuiDrawer-paper": {
                  boxSizing: "border-box",
                  width: drawerWidth,
                },
              }}
            >
              <DrawerContent
                handleDrawerToggle={handleDrawerToggle}
                menuItems={displayMenuItems}
              />
            </Drawer>
          </Box>
          <Box
            className="nav-left"
            sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}
          >
            <Button
              component={Link}
              to={"/"}
              disableRipple
              className="logo-button"
            >
              <img
                className="header-logo"
                alt="veridian-logo"
                src={Logo}
              />
            </Button>
            {displayMenuItems.map((item) => {
              const isActive = isActivePath(item.path, location.pathname);

              return (
                <MenuItem
                  key={item.key}
                  component={Link}
                  to={item.path}
                  disableRipple
                  className={isActive ? "active" : ""}
                >
                  <Typography textAlign="center">
                    {getIcon(item.icons, isActive)}
                    {item.label}
                  </Typography>
                  {isActive && <div className="active-bar" />}
                </MenuItem>
              );
            })}
          </Box>
          <Box
            className="nav-right"
            sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1 }}
          >
            {/* KERIAuth Status */}
            {isAuthorized && aid && (
              <Tooltip title={`Authorized AID: ${aid}`}>
                <Chip
                  icon={<CheckCircle />}
                  label={`${aid.substring(0, 8)}...${aid.slice(-4)}`}
                  color="success"
                  size="small"
                  sx={{ mr: 1 }}
                />
              </Tooltip>
            )}
            
            <IconButton
              size="large"
              aria-label="show new notifications"
              color="inherit"
              component={Link}
              to={"/notifications"}
              disableRipple
              className={location.pathname === "/notifications" ? "active" : ""}
            >
              <Badge
                badgeContent={0}
                color="error"
              >
                {location.pathname === "/notifications" ? (
                  <NotificationsFull />
                ) : (
                  <NotificationsOutlined />
                )}
              </Badge>
            </IconButton>
            <IconButton
              size="large"
              aria-label="show settings"
              color="inherit"
              component={Link}
              to={"/settings"}
              disableRipple
              className={location.pathname === "/settings" ? "active" : ""}
            >
              <Badge>
                {location.pathname === "/settings" ? (
                  <SettingsFull />
                ) : (
                  <SettingsOutlined />
                )}
              </Badge>
            </IconButton>
            
            {/* Logout Button */}
            {isAuthorized && (
              <Tooltip title="Logout">
                <IconButton
                  size="large"
                  aria-label="logout"
                  color="inherit"
                  onClick={handleLogout}
                  disableRipple
                >
                  <Logout />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <SwitchAccount />
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export { NavBar };
