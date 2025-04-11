import { useLocation } from 'react-router-dom';
import { routes, RouteConfig } from '../config/routes';

export interface Breadcrumb {
  path: string;
  label: string;
  isLast: boolean;
}

const findRouteByPath = (path: string, routeList: RouteConfig[]): RouteConfig | undefined => {
  for (const route of routeList) {
    if (route.path === path) return route;
    if (route.children) {
      const childPath = path.replace(`${route.path}/`, '');
      const childRoute = route.children.find(child => 
        child.path === childPath || child.path === ''
      );
      if (childRoute) return childRoute;
    }
  }
  return undefined;
};

export function useBreadcrumbs(): Breadcrumb[] {
  const location = useLocation();
  const currentRoute = findRouteByPath(location.pathname.replace(/^\//, ''), routes);
  
  if (!currentRoute?.breadcrumb) {
    return [];
  }

  const breadcrumbSegments = currentRoute.breadcrumb.split(' > ');
  
  return breadcrumbSegments.map((segment, index) => {
    const isLast = index === breadcrumbSegments.length - 1;
    const pathSegments = breadcrumbSegments
      .slice(0, index + 1)
      .join('/')
      .toLowerCase();
    
    return {
      path: `/${pathSegments}`,
      label: segment,
      isLast
    };
  });
}