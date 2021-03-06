<?php
/* +***********************************************************************************************************************************
 * The contents of this file are subject to the YetiForce Public License Version 1.1 (the "License"); you may not use this file except
 * in compliance with the License.
 * Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * See the License for the specific language governing rights and limitations under the License.
 * The Original Code is YetiForce.
 * The Initial Developer of the Original Code is YetiForce. Portions created by YetiForce are Copyright (C) www.yetiforce.com. 
 * All Rights Reserved.
 * *********************************************************************************************************************************** */

class Calendar_RightPanel_View extends Vtiger_IndexAjax_View
{

	function __construct()
	{
		parent::__construct();
		$this->exposeMethod('getUsersList');
		$this->exposeMethod('getGroupsList');
		$this->exposeMethod('getActivityType');
	}

	function getUsersList(Vtiger_Request $request)
	{
		$viewer = $this->getViewer($request);
		$moduleName = $request->getModule();
		$currentUser = Users_Record_Model::getCurrentUserModel();
		$roleInstance = Settings_Roles_Record_Model::getInstanceById($currentUser->get('roleid'));
		$clendarallorecords = $roleInstance->get('clendarallorecords');
		switch ($clendarallorecords) {
			case 3:
				$users = $currentUser->getAccessibleUsers();
				break;
			case 1:
			case 2:
			default:
				$users[$currentUser->getId()] = $currentUser->getName();
				break;
		}

		$viewer->assign('MODULE', $moduleName);
		$viewer->assign('ALL_ACTIVEUSER_LIST', $users);
		$viewer->assign('USER_MODEL', $currentUser);
		$viewer->view('RightPanel.tpl', $moduleName);
	}

	function getGroupsList(Vtiger_Request $request)
	{
		$viewer = $this->getViewer($request);
		$moduleName = $request->getModule();
		$currentUser = Users_Record_Model::getCurrentUserModel();
		$roleInstance = Settings_Roles_Record_Model::getInstanceById($currentUser->get('roleid'));
		$clendarallorecords = $roleInstance->get('clendarallorecords');
		switch ($clendarallorecords) {
			case 1:
				$groups = [];
				break;
			case 2:
			case 3:
			default:
				$groups = $currentUser->getAccessibleGroups();
				break;
		}
		$viewer->assign('MODULE', $moduleName);
		$viewer->assign('ALL_ACTIVEGROUP_LIST', $groups);
		$viewer->view('RightPanel.tpl', $moduleName);
	}

	function getActivityType(Vtiger_Request $request)
	{
		$viewer = $this->getViewer($request);
		$moduleName = $request->getModule();
		$viewer->assign('MODULE', $moduleName);
		$viewer->assign('ACTIVITY_TYPE', Calendar_Module_Model::getCalendarTypes());
		$viewer->view('RightPanel.tpl', $moduleName);
	}
}
