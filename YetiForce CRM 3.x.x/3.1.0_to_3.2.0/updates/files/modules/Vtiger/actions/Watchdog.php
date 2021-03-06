<?php

/**
 * Watchdog Action Class
 * @package YetiForce.Action
 * @license licenses/License.html
 * @author Mariusz Krzaczkowski <m.krzaczkowski@yetiforce.com>
 */
class Vtiger_Watchdog_Action extends Vtiger_Action_Controller
{

	function checkPermission(Vtiger_Request $request)
	{
		$moduleName = $request->getModule();
		$recordId = $request->get('record');
		if (empty($recordId)) {
			if (!Users_Privileges_Model::isPermitted($moduleName, 'WatchingModule')) {
				throw new \Exception\NoPermittedToRecord('LBL_NO_PERMISSIONS_FOR_THE_RECORD');
			}
		} else {
			if (!Users_Privileges_Model::isPermitted($moduleName, 'DetailView', $recordId) || !Users_Privileges_Model::isPermitted($moduleName, 'WatchingRecords')) {
				throw new \Exception\NoPermittedToRecord('LBL_NO_PERMISSIONS_FOR_THE_RECORD');
			}
		}
		if ($request->has('user')) {
			$userList = array_keys(\includes\fields\Owner::getInstance()->getAccessibleUsers());
			if (!in_array($request->get('user'), $userList)) {
				throw new \Exception\NoPermittedToRecord('LBL_NO_PERMISSIONS_FOR_THE_RECORD');
			}
		}
		return true;
	}

	public function process(Vtiger_Request $request)
	{
		$moduleName = $request->getModule();
		$record = $request->get('record');
		$state = $request->get('state');
		$user = false;
		if ($request->has('user')) {
			$user = $request->get('user');
		}
		if (empty($record)) {
			$watchdog = Vtiger_Watchdog_Model::getInstance($moduleName);
			$watchdog->changeModuleState($state, $user);
		} else {
			$watchdog = Vtiger_Watchdog_Model::getInstanceById($record, $moduleName);
			$watchdog->changeRecordState($state, $user);
		}
		$response = new Vtiger_Response();
		$response->setResult($state);
		$response->emit();
	}
}
