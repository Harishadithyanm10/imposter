# Prepares the Xcode project for a command-line / CI build (used by .github/workflows/ios.yml).
# Reads settings from environment variables, so nothing is hard-coded and you never open Xcode.
require 'xcodeproj'

proj_path = 'ios/App/App.xcodeproj'
proj = Xcodeproj::Project.open(proj_path)
target = proj.targets.find { |t| t.name == 'App' } || abort('App target not found')

# 1. Bundle id (from capacitor.config.json), version and build number
target.build_configurations.each do |c|
  c.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = ENV.fetch('APP_ID')
  c.build_settings['MARKETING_VERSION'] = ENV.fetch('APP_VERSION', '1.0')
  c.build_settings['CURRENT_PROJECT_VERSION'] = ENV.fetch('BUILD_NUMBER', '1')
  next unless ENV['SIGNING'] == 'true'
  # Manual signing for the App target only (Swift packages must not get a provisioning profile)
  c.build_settings['CODE_SIGN_STYLE'] = 'Manual'
  c.build_settings['DEVELOPMENT_TEAM'] = ENV.fetch('TEAM_ID')
  c.build_settings['PROVISIONING_PROFILE_SPECIFIER'] = ENV.fetch('PROFILE_NAME')
  c.build_settings['CODE_SIGN_IDENTITY'] = 'Apple Distribution'
  c.build_settings.delete('CODE_SIGN_IDENTITY[sdk=iphoneos*]')
end

# 2. GoogleService-Info.plist must be part of the app bundle (needed for Google sign-in)
plist = 'ios/App/App/GoogleService-Info.plist'
if File.exist?(plist)
  group = proj.main_group['App']
  unless group.files.any? { |f| f.path == 'GoogleService-Info.plist' }
    ref = group.new_file('GoogleService-Info.plist')
    target.resources_build_phase.add_file_reference(ref)
  end
end

# 3. A shared scheme so xcodebuild can find it
schemes_dir = Xcodeproj::XCScheme.shared_data_dir(proj_path)
unless File.exist?(File.join(schemes_dir, 'App.xcscheme'))
  scheme = Xcodeproj::XCScheme.new
  scheme.add_build_target(target)
  scheme.set_launch_target(target)
  scheme.save_as(proj_path, 'App', true)
end

proj.save
puts "Prepared #{ENV['APP_ID']} #{ENV.fetch('APP_VERSION', '1.0')} (#{ENV.fetch('BUILD_NUMBER', '1')})"
